import { prisma } from "@/lib/db";
import { countTotalAttendanceByStudent } from "@/lib/attendance";

export async function getSessionAttendanceTotals(options: {
  sessionId: string;
  classId: string;
  date: Date;
  lateStudentIds: string[];
  absentStudentIds: string[];
}) {
  const studentIds = [...options.lateStudentIds, ...options.absentStudentIds];
  if (studentIds.length === 0) return { late: new Map<string, number>(), absent: new Map<string, number>() };
  const sessions = await prisma.attendanceSession.findMany({
    where: { classId: options.classId, attendanceDate: { lte: options.date } },
    select: {
      id: true,
      attendanceDate: true,
      createdAt: true,
      timetableEntry: { select: { startTime: true } },
      // Keep the session timeline intact so reports exclude sessions later than the selected one.
      records: { where: { studentId: { in: studentIds } }, select: { studentId: true, status: true } },
    },
  });
  sessions.sort((a, b) =>
    b.attendanceDate.getTime() - a.attendanceDate.getTime() ||
    (b.timetableEntry?.startTime ?? "00:00").localeCompare(a.timetableEntry?.startTime ?? "00:00") ||
    b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id),
  );
  return {
    late: countTotalAttendanceByStudent(sessions, options.sessionId, options.lateStudentIds, "late"),
    absent: countTotalAttendanceByStudent(sessions, options.sessionId, options.absentStudentIds, "absent"),
  };
}
