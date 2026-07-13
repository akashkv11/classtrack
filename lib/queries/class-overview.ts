import { prisma } from "@/lib/db";
import { parseISODate, todayISO } from "@/lib/dates";
import {
  getOpenAttendanceAlertCountForClass,
  getSyllabusProgressPercentageForClass,
} from "@/lib/queries/class-summaries";

export type ClassWorkspaceOverview = {
  today: string;
  attendance_marked: boolean;
  attendance_session_id: string | null;
  attendance_sessions_today: number;
  diary_added_today: boolean;
  open_alerts_count: number;
  open_student_notes: number;
  open_parent_follow_ups: number;
  syllabus_progress_percentage: number | null;
  student_count: number;
};

export async function getClassWorkspaceOverview(
  classId: string,
): Promise<ClassWorkspaceOverview | null> {
  const today = todayISO();
  const month = today.slice(0, 7);

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      _count: { select: { students: { where: { isActive: true } } } },
      attendanceSessions: {
        where: { attendanceDate: parseISODate(today) },
        select: { id: true },
      },
    },
  });

  if (!cls) return null;

  const [diaryToday, openNotes, openParentFollowUps, syllabusProgress, openAlerts] =
    await Promise.all([
      prisma.teachingDiaryEntry.findFirst({
        where: { classId, entryDate: parseISODate(today) },
        select: { id: true },
      }),
      prisma.studentNote.count({ where: { classId, status: "OPEN" } }),
      prisma.parentCommunication.count({
        where: {
          classId,
          status: { in: ["OPEN", "FOLLOW_UP_NEEDED"] },
          followUpNeeded: true,
        },
      }),
      getSyllabusProgressPercentageForClass(classId),
      getOpenAttendanceAlertCountForClass(classId, month),
    ]);

  const todaySessions = cls.attendanceSessions;
  const singleSession = todaySessions.length === 1 ? todaySessions[0] : null;

  return {
    today,
    attendance_marked: todaySessions.length > 0,
    attendance_session_id: singleSession?.id ?? null,
    attendance_sessions_today: todaySessions.length,
    diary_added_today: Boolean(diaryToday),
    open_alerts_count: openAlerts,
    open_student_notes: openNotes,
    open_parent_follow_ups: openParentFollowUps,
    syllabus_progress_percentage: syllabusProgress,
    student_count: cls._count.students,
  };
}
