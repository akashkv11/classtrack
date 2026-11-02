import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { countAbsentDaysByStudent } from "@/lib/attendance";
import { endOfMonth, formatISODate, startOfMonth } from "@/lib/dates";
import { serializeTimetableEntry } from "@/lib/queries/timetable";
import { getScheduleForDate } from "@/lib/timetable";
import {
  buildClassUpdateMessage,
  buildSeparateClassUpdateMessage,
  buildTopicTakenFromDiary,
  buildWhatsAppUrl,
  formatClassTimeRange,
  subjectForStream,
} from "@/lib/whatsapp";
import { getWhatsAppMissingItems } from "@/lib/whatsapp-readiness";
import { getSetting, SETTING_CLASS_UPDATE_RECIPIENT } from "@/lib/settings";
import { getPreparationRoster } from "@/lib/queries/preparation";
import { preparationMessageLines } from "@/lib/preparation";
import { getSessionAttendanceTotals } from "@/lib/queries/attendance-totals";

type RouteContext = { params: Promise<{ sessionId: string }> };

const diaryInclude = {
  syllabusChapter: {
    select: { chapterNumber: true, chapterTitle: true },
  },
  syllabusSubject: {
    select: { subjectName: true },
  },
  syllabusTopic: {
    select: { topicTitle: true, subtopics: true },
  },
  topics: {
    include: {
      syllabusTopic: {
        select: { topicTitle: true, subtopics: true },
      },
    },
  },
  timetableEntry: {
    include: {
      class: { select: { displayName: true } },
    },
  },
} as const;

async function findDiaryEntryForSession(options: {
  classId: string;
  attendanceDate: Date;
  timetableEntryId: string | null;
}) {
  if (options.timetableEntryId) {
    const linkedEntry = await prisma.teachingDiaryEntry.findFirst({
      where: {
        classId: options.classId,
        entryDate: options.attendanceDate,
        timetableEntryId: options.timetableEntryId,
      },
      include: diaryInclude,
      orderBy: { createdAt: "desc" },
    });
    return linkedEntry;
  }

  return prisma.teachingDiaryEntry.findFirst({
    where: {
      classId: options.classId,
      entryDate: options.attendanceDate,
    },
    include: diaryInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { sessionId } = await context.params;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      timetableEntry: {
        include: {
          class: { select: { displayName: true } },
        },
      },
      records: {
        include: { student: true },
        orderBy: { student: { rollNo: "asc" } },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (request.nextUrl.searchParams.get("template") === "separate") {
    const [diaryEntry, phoneNumber, preparation, attendanceTotals] = await Promise.all([
      findDiaryEntryForSession({
        classId: session.classId,
        attendanceDate: session.attendanceDate,
        timetableEntryId: session.timetableEntryId,
      }),
      getSetting(SETTING_CLASS_UPDATE_RECIPIENT),
      getPreparationRoster(session.classId, formatISODate(session.attendanceDate), session.timetableEntryId),
      getSessionAttendanceTotals({
        sessionId: session.id,
        classId: session.classId,
        date: session.attendanceDate,
        lateStudentIds: session.records.filter((record) => record.status === "late").map((record) => record.studentId),
        absentStudentIds: session.records.filter((record) => record.status === "absent").map((record) => record.studentId),
      }),
    ]);
    const chapter = diaryEntry?.syllabusChapter;
    const message = buildSeparateClassUpdateMessage({
      className: session.class.displayName,
      date: session.attendanceDate,
      subject: session.timetableEntry?.subject ??
        diaryEntry?.timetableEntry?.subject ??
        diaryEntry?.syllabusSubject?.subjectName ??
        subjectForStream(session.class.stream),
      chapter: chapter
        ? `${chapter.chapterNumber ? `${chapter.chapterNumber}. ` : ""}${chapter.chapterTitle}`
        : null,
      topics: diaryEntry ? buildTopicTakenFromDiary(diaryEntry) : null,
      preparationLines: preparationMessageLines(preparation.records, preparation.includePartial),
      diaryStatus: diaryEntry?.diaryStatus,
      absentees: session.records.filter((record) => record.status === "absent").map((record) => ({
        fullName: record.student.fullName,
        totalCount: attendanceTotals.absent.get(record.studentId) ?? 1,
      })),
      lateStudents: session.records.filter((record) => record.status === "late").map((record) => ({
        fullName: record.student.fullName,
        totalCount: attendanceTotals.late.get(record.studentId) ?? 1,
      })),
    });
    return NextResponse.json({
      phone_number: phoneNumber,
      message,
      students: preparation.records,
      class_id: session.classId,
      attendance_date: formatISODate(session.attendanceDate),
      timetable_entry_id: session.timetableEntryId,
      threshold: preparation.threshold,
      includePartial: preparation.includePartial,
    });
  }

  if (!session.class.whatsappNumber) {
    return NextResponse.json(
      { error: "WhatsApp number not configured for this class" },
      { status: 400 },
    );
  }

  const absentRecords = session.records.filter((r) => r.status === "absent");
  const absentStudentIds = absentRecords.map((r) => r.studentId);

  const attendanceDate = session.attendanceDate;
  const year = attendanceDate.getUTCFullYear();
  const month = attendanceDate.getUTCMonth() + 1;
  const rangeStart = startOfMonth(year, month);
  const rangeEnd = endOfMonth(year, month);
  const isoDate = formatISODate(attendanceDate);

  const [monthSessions, diaryEntry] = await Promise.all([
    absentStudentIds.length
      ? prisma.attendanceSession.findMany({
          where: {
            classId: session.classId,
            attendanceDate: { gte: rangeStart, lte: rangeEnd },
          },
          include: {
            records: {
              where: {
                status: "absent",
                studentId: { in: absentStudentIds },
              },
            },
          },
        })
      : Promise.resolve([]),
    findDiaryEntryForSession({
      classId: session.classId,
      attendanceDate,
      timetableEntryId: session.timetableEntryId,
    }),
  ]);

  const monthlyAbsentCounts = countAbsentDaysByStudent(monthSessions);

  const absentees = absentRecords.map((r) => ({
    rollNo: r.student.rollNo,
    fullName: r.student.fullName,
    monthlyAbsentCount: monthlyAbsentCounts.get(r.studentId) ?? 1,
  }));

  const timetableRecord =
    session.timetableEntry ?? diaryEntry?.timetableEntry ?? null;

  let subject =
    diaryEntry?.syllabusSubject?.subjectName ??
    subjectForStream(session.class.stream);
  let classTime: string | null = null;

  if (timetableRecord) {
    const timetableEntry = serializeTimetableEntry(timetableRecord);
    subject = timetableEntry.subject;
    const schedule = getScheduleForDate(timetableEntry, isoDate);
    if (schedule) {
      classTime = formatClassTimeRange(schedule.start_time, schedule.end_time);
    }
  }

  const topicTaken = diaryEntry ? buildTopicTakenFromDiary(diaryEntry) : null;

  const missingItems = getWhatsAppMissingItems({
    classId: session.classId,
    attendanceDate: isoDate,
    timetableEntryId: session.timetableEntryId,
    whatsappChannelUrl: session.class.whatsappChannelUrl,
    diaryEntry,
  });

  const message = buildClassUpdateMessage({
    className: session.class.displayName,
    subject,
    date: session.attendanceDate,
    classTime,
    absentees,
    topicTaken,
    whatsappChannelUrl: session.class.whatsappChannelUrl,
    diaryStatus: diaryEntry?.diaryStatus,
  });

  return NextResponse.json({
    phone_number: session.class.whatsappNumber,
    message,
    whatsapp_url: buildWhatsAppUrl(session.class.whatsappNumber, message),
    class_id: session.classId,
    attendance_date: isoDate,
    class_time: classTime,
    missing_items: missingItems,
  });
}
