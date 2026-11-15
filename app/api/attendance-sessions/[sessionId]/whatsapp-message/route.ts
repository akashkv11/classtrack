import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { countAbsentDaysByStudent } from "@/lib/attendance";
import { endOfMonth, formatISODate, startOfMonth } from "@/lib/dates";
import { buildTopicTakenFromDiary, buildWhatsAppUrl, formatClassTimeRange } from "@/lib/whatsapp";
import { buildDailyClassMessage, buildDailySeparateMessage, type DailyMessageDetails } from "@/lib/daily-messages";
import { buildTeachingDiaryLink } from "@/lib/timetable/links";
import type { WhatsAppMissingItem } from "@/lib/whatsapp-readiness";
import { getSetting, SETTING_CLASS_UPDATE_RECIPIENT } from "@/lib/settings";
import { getPreparationRoster } from "@/lib/queries/preparation";
import { preparationMessageLines } from "@/lib/preparation";

type RouteContext = { params: Promise<{ sessionId: string }> };
export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();
  const { sessionId } = await context.params;
  const anchor = await prisma.attendanceSession.findUnique({ where: { id: sessionId }, include: { class: true } });
  if (!anchor) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const date = formatISODate(anchor.attendanceDate);
  const sessions = await prisma.attendanceSession.findMany({
    where: { classId: anchor.classId, attendanceDate: anchor.attendanceDate },
    orderBy: [{ startTime: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }, { id: "asc" }],
    include: {
      records: { include: { student: { select: { fullName: true } } }, orderBy: [{ student: { rollNo: "asc" } }, { studentId: "asc" }] },
      teachingDiaryEntries: { take: 1, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], include: {
        syllabusChapter: { select: { chapterTitle: true, chapterNumber: true } },
        syllabusTopic: { select: { topicTitle: true, subtopics: true } },
        topics: { include: { syllabusTopic: { select: { topicTitle: true, subtopics: true } } } },
      } },
    },
  });
  const details: DailyMessageDetails = { class_name: anchor.class.displayName, date, channel_url: anchor.class.whatsappChannelUrl,
    sessions: sessions.map(s => {
      const diary = s.teachingDiaryEntries[0];
      return { id: s.id, subject: s.subject, start_time: s.startTime, end_time: s.endTime,
        diary_status: diary?.diaryStatus ?? null, chapter: diary?.syllabusChapter?.chapterTitle ?? null,
        topics: diary ? buildTopicTakenFromDiary(diary) : null, attendance_recorded: s.records.length > 0,
        absentees: s.records.filter(r => r.status === "absent").map(r => ({ id: r.studentId, name: r.student.fullName })),
        late_students: s.records.filter(r => r.status === "late").map(r => ({ id: r.studentId, name: r.student.fullName })),
      };
    }) };
  const missing: WhatsAppMissingItem[] = sessions.filter(s => !s.teachingDiaryEntries.length).map(s => ({
    id: "teaching_diary", label: `Teaching diary: ${s.subject ?? "Class session"} · ${s.startTime ?? "Time not recorded"}`,
    description: "Add the diary and session type for this session.", fix_href: buildTeachingDiaryLink(anchor.classId, { sessionId: s.id }),
  }));
  const common = { class_id: anchor.classId, attendance_date: date, session_count: sessions.length, daily_details: details };
  if (request.nextUrl.searchParams.get("template") === "separate") {
    const [phoneNumber, preparation] = await Promise.all([
      getSetting(SETTING_CLASS_UPDATE_RECIPIENT), getPreparationRoster(anchor.classId, date, null),
    ]);
    return NextResponse.json({ ...common, phone_number: phoneNumber,
      message: buildDailySeparateMessage(details, preparationMessageLines(preparation.records)),
      students: preparation.records, timetable_entry_id: null, threshold: preparation.threshold, includePartial: preparation.includePartial,
      missing_items: missing,
    });
  }
  if (!anchor.class.whatsappNumber) return NextResponse.json({ error: "WhatsApp number not configured for this class" }, { status: 400 });
  if (sessions.length === 1 && details.sessions[0].absentees.length) {
    const monthSessions = await prisma.attendanceSession.findMany({ where: {
      classId: anchor.classId, attendanceDate: { gte: startOfMonth(anchor.attendanceDate.getUTCFullYear(), anchor.attendanceDate.getUTCMonth() + 1), lte: endOfMonth(anchor.attendanceDate.getUTCFullYear(), anchor.attendanceDate.getUTCMonth() + 1) },
    }, include: { records: { where: { status: "absent", studentId: { in: details.sessions[0].absentees.map(a => a.id) } } } } });
    const counts = countAbsentDaysByStudent(monthSessions);
    for (const absentee of details.sessions[0].absentees) absentee.monthly_absent_count = counts.get(absentee.id) ?? 1;
  }
  if (!anchor.class.whatsappChannelUrl) missing.unshift({ id: "whatsapp_channel", label: "WhatsApp channel link", description: "Add a study materials channel link.", fix_href: `/classes/${anchor.classId}/settings` });
  const message = buildDailyClassMessage(details);
  const first = details.sessions[0];
  return NextResponse.json({ ...common, phone_number: anchor.class.whatsappNumber, message,
    whatsapp_url: buildWhatsAppUrl(anchor.class.whatsappNumber, message),
    class_time: sessions.length === 1 && first.start_time && first.end_time ? formatClassTimeRange(first.start_time, first.end_time) : null,
    period_options: [], missing_items: missing,
  });
}
