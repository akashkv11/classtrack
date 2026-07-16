import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { countAbsentDaysByStudent } from "@/lib/attendance";
import { endOfMonth, formatISODate, startOfMonth } from "@/lib/dates";
import { serializeTimetableEntry } from "@/lib/queries/timetable";
import { getScheduleForDate } from "@/lib/timetable";
import {
  buildClassUpdateMessage,
  buildTopicTakenFromDiary,
  buildWhatsAppUrl,
  formatClassTimeRange,
  subjectForStream,
} from "@/lib/whatsapp";
import { getWhatsAppMissingItems } from "@/lib/whatsapp-readiness";

type RouteContext = { params: Promise<{ sessionId: string }> };

const diaryInclude = {
  syllabusSubject: {
    select: { subjectName: true },
  },
  syllabusTopic: {
    select: { topicTitle: true, subtopics: true },
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
