import { prisma } from "@/lib/db";
import { parseISODate, todayISO } from "@/lib/dates";
import { getAttendanceAlertsForClass } from "@/lib/queries/attendance-alerts";
import { getSyllabusSummary } from "@/lib/syllabus/progress";

export type ClassWorkspaceOverview = {
  today: string;
  attendance_marked: boolean;
  attendance_session_id: string | null;
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
    include: {
      _count: { select: { students: { where: { isActive: true } } } },
      attendanceSessions: {
        where: { attendanceDate: parseISODate(today) },
        take: 1,
        select: { id: true },
      },
      syllabusSubjects: {
        include: { chapters: { include: { topics: true } } },
      },
    },
  });

  if (!cls) return null;

  const [diaryToday, openNotes, openParentFollowUps, alertData] = await Promise.all([
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
    getAttendanceAlertsForClass(classId, month, { status: "ALL" }),
  ]);

  const topics = cls.syllabusSubjects.flatMap((subject) =>
    subject.chapters.flatMap((chapter) => chapter.topics),
  );
  const syllabusProgress =
    topics.length > 0 ? getSyllabusSummary(topics).progressPercentage : null;

  const openAlerts =
    alertData?.alerts.filter(
      (alert) => alert.status === "OPEN" || alert.status === "IN_PROGRESS",
    ).length ?? 0;

  const todaySession = cls.attendanceSessions[0];

  return {
    today,
    attendance_marked: Boolean(todaySession),
    attendance_session_id: todaySession?.id ?? null,
    diary_added_today: Boolean(diaryToday),
    open_alerts_count: openAlerts,
    open_student_notes: openNotes,
    open_parent_follow_ups: openParentFollowUps,
    syllabus_progress_percentage: syllabusProgress,
    student_count: cls._count.students,
  };
}
