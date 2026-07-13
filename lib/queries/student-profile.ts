import { prisma } from "@/lib/db";
import {
  calculateAttendancePercentage,
  type AttendanceStatus,
} from "@/lib/attendance";
import { endOfMonth, startOfMonth } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import { getStudentAssessmentHistory } from "@/lib/queries/assessments";
import { lateCountsAsPresent } from "@/lib/settings";
import type {
  StudentProfile,
  StudentProfileClassOverview,
  StudentDirectoryItem,
  StudentProfileListItem,
} from "@/lib/types/student-profile";

function currentMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export async function getStudentProfile(
  classId: string,
  studentId: string,
): Promise<StudentProfile | null> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    include: {
      class: { select: { id: true, displayName: true } },
    },
  });

  if (!student) return null;

  const month = currentMonth();
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  const rangeStart = startOfMonth(year, monthNum);
  const rangeEnd = endOfMonth(year, monthNum);

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId,
      attendanceDate: { gte: rangeStart, lte: rangeEnd },
    },
    include: { records: true },
    orderBy: { attendanceDate: "asc" },
  });

  const lateAsPresent = await lateCountsAsPresent();
  const workingDays = sessions.length;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;

  for (const session of sessions) {
    const record = session.records.find((r) => r.studentId === studentId);
    if (!record) continue;
    const status = record.status as AttendanceStatus;
    if (status === "present") presentDays += 1;
    if (status === "absent") absentDays += 1;
    if (status === "late") lateDays += 1;
  }

  const attendancePercentage = calculateAttendancePercentage({
    presentDays,
    lateDays,
    workingDays,
    lateCountsAsPresent: lateAsPresent,
  });

  const assessmentHistory = await getStudentAssessmentHistory(classId, studentId);
  const assessments = assessmentHistory?.entries ?? [];
  const latest = assessments[0] ?? null;

  return {
    student: {
      id: student.id,
      roll_no: student.rollNo,
      full_name: student.fullName,
      admission_no: student.admissionNo,
      email: student.email,
      parent_phone: student.parentPhone,
      is_active: student.isActive,
    },
    class: {
      id: student.class.id,
      display_name: student.class.displayName,
    },
    summary: {
      attendance_percentage: attendancePercentage,
      attendance_month: month,
      average_marks_percentage: assessmentHistory?.average_percentage ?? null,
      latest_assessment: latest
        ? {
            assessment_id: latest.assessment_id,
            assessment_name: latest.assessment_name,
            marks_obtained: latest.marks_obtained,
            max_marks: latest.max_marks,
            assessment_date: latest.assessment_date,
          }
        : null,
    },
    attendance: {
      month,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      working_days: workingDays,
      attendance_percentage: attendancePercentage,
    },
    assessments,
  };
}

export async function getStudentsForProfileList(
  classId: string,
): Promise<StudentProfileListItem[]> {
  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: { rollNo: "asc" },
    select: {
      id: true,
      rollNo: true,
      fullName: true,
      isActive: true,
    },
  });

  return students.map((s) => ({
    id: s.id,
    roll_no: s.rollNo,
    full_name: s.fullName,
    is_active: s.isActive,
  }));
}

export async function getStudentProfileOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: StudentProfileClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => ({
      class_id: cls.id,
      display_name: cls.displayName,
      student_count: cls._count.students,
    })),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}

export async function getStudentsDirectoryForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: { id: string; display_name: string }[];
  students: StudentDirectoryItem[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [], students: [] };
  }

  const students = await prisma.student.findMany({
    where: {
      class: { academicYearId: activeYear.id, isActive: true },
    },
    orderBy: [{ class: { displayName: "asc" } }, { rollNo: "asc" }],
    select: {
      id: true,
      rollNo: true,
      fullName: true,
      admissionNo: true,
      isActive: true,
      class: { select: { id: true, displayName: true } },
    },
  });

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: classes.map((cls) => ({
      id: cls.id,
      display_name: cls.displayName,
    })),
    students: students.map((student) => ({
      id: student.id,
      roll_no: student.rollNo,
      full_name: student.fullName,
      admission_no: student.admissionNo,
      is_active: student.isActive,
      class: {
        id: student.class.id,
        display_name: student.class.displayName,
      },
    })),
  };
}
