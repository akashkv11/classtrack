import { prisma } from "@/lib/db";
import { formatISODate } from "@/lib/dates";
import { calculateAttendancePercentage } from "@/lib/attendance";
import { lateCountsAsPresent } from "@/lib/settings";
import type { StudentProfileReport } from "@/lib/types/student-profile-report";

export async function getStudentProfileReports(classId: string, studentId?: string): Promise<StudentProfileReport[] | null> {
  const cls = await prisma.class.findUnique({ where: { id: classId }, select: {
    id: true, displayName: true, academicYear: { select: { name: true } },
  } });
  if (!cls) return null;
  const students = await prisma.student.findMany({ where: { classId, ...(studentId ? { id: studentId } : {}) },
    orderBy: [{ rollNo: "asc" }, { fullName: "asc" }], select: {
      id: true, rollNo: true, fullName: true, admissionNo: true, email: true, parentPhone: true, isActive: true,
    } });
  if (!students.length) return [];
  const ids = students.map(s => s.id);
  const [sessions, marks, preparation, lateAsPresent] = await Promise.all([
    prisma.attendanceSession.findMany({ where: { classId }, orderBy: [{ attendanceDate: "asc" }, { startTime: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }, { id: "asc" }], select: {
      id: true, attendanceDate: true, subject: true, startTime: true, endTime: true,
      records: { where: { studentId: { in: ids } }, select: { studentId: true, status: true } },
    } }),
    prisma.assessmentMark.findMany({ where: { studentId: { in: ids }, assessment: { classId } },
      orderBy: [{ assessment: { assessmentDate: "desc" } }, { assessmentId: "asc" }], select: {
        studentId: true, marksObtained: true, assessment: { select: { id: true, name: true, assessmentDate: true,
          assessmentType: true, maxMarks: true, syllabusSubject: { select: { subjectName: true } } } },
      } }),
    prisma.studentPreparation.findMany({ where: { classId, studentId: { in: ids } },
      orderBy: [{ preparationDate: "asc" }, { id: "asc" }], select: {
        id: true, studentId: true, preparationDate: true, timetableEntryId: true, status: true,
        timetableEntry: { select: { subject: true, startTime: true, endTime: true } },
      } }),
    lateCountsAsPresent(),
  ]);
  // Group once so whole-class reports do not issue queries per student.
  const attendanceBySession = new Map(sessions.map(s => [s.id, new Map(s.records.map(r => [r.studentId, r.status]))]));
  return students.map(student => {
    const attendance = sessions.map(s => ({ session_id: s.id, date: formatISODate(s.attendanceDate),
      subject: s.subject, start_time: s.startTime, end_time: s.endTime,
      status: attendanceBySession.get(s.id)?.get(student.id) ?? "not_marked" }));
    const assessments = marks.filter(m => m.studentId === student.id).map(m => {
      const obtained = m.marksObtained === null ? null : Number(m.marksObtained);
      const max = Number(m.assessment.maxMarks);
      return { id: m.assessment.id, name: m.assessment.name, date: formatISODate(m.assessment.assessmentDate),
        type: m.assessment.assessmentType, subject: m.assessment.syllabusSubject.subjectName,
        marks: obtained, max_marks: max, percentage: obtained !== null && max > 0 ? Math.round(obtained / max * 1000) / 10 : null };
    });
    const percentages = assessments.flatMap(a => a.percentage === null ? [] : [a.percentage]);
    const count = (status: string) => attendance.filter(a => a.status === status).length;
    return {
      student: { id: student.id, roll_no: student.rollNo, full_name: student.fullName, admission_no: student.admissionNo,
        email: student.email, parent_phone: student.parentPhone, is_active: student.isActive },
      class: { id: cls.id, display_name: cls.displayName, academic_year: cls.academicYear.name },
      summary: { total_sessions: attendance.length, present: count("present"), absent: count("absent"), late: count("late"), unmarked: count("not_marked"),
        attendance_percentage: calculateAttendancePercentage({ workingDays: attendance.length, presentDays: count("present"), lateDays: count("late"), lateCountsAsPresent: lateAsPresent }),
        average_marks_percentage: percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length * 10) / 10 : null },
      attendance, assessments,
      preparation: preparation.filter(p => p.studentId === student.id).map(p => ({ id: p.id, date: formatISODate(p.preparationDate),
        scope: p.timetableEntryId ? "session" : "daily", subject: p.timetableEntry?.subject ?? null,
        start_time: p.timetableEntry?.startTime ?? null, end_time: p.timetableEntry?.endTime ?? null, status: p.status })),
    };
  });
}
