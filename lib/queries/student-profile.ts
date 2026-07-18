import { prisma } from "@/lib/db";
import {
  calculateAttendancePercentage,
  type AttendanceStatus,
} from "@/lib/attendance";
import { endOfMonth, formatISODate, startOfMonth } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import { getStudentAssessmentHistory } from "@/lib/queries/assessments";
import { serializeTimetableEntry } from "@/lib/queries/timetable";
import { lateCountsAsPresent } from "@/lib/settings";
import { formatTime12h, getScheduleForDate } from "@/lib/timetable";
import type {
  StudentProfile,
  StudentProfileClassOverview,
  StudentDirectoryItem,
  StudentProfileListItem,
  StudentAttendanceDetailRow,
  StudentMonthlyAttendance,
} from "@/lib/types/student-profile";

function currentMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function parseMonth(month: string): { year: number; monthNum: number } | null {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(monthNum)) return null;
  if (monthNum < 1 || monthNum > 12) return null;
  return { year, monthNum };
}

export async function getStudentMonthlyAttendance(
  classId: string,
  studentId: string,
  month: string,
): Promise<StudentMonthlyAttendance | null> {
  const parsedMonth = parseMonth(month);
  if (!parsedMonth) return null;

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    select: { id: true },
  });
  if (!student) return null;

  const rangeStart = startOfMonth(parsedMonth.year, parsedMonth.monthNum);
  const rangeEnd = endOfMonth(parsedMonth.year, parsedMonth.monthNum);

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId,
      attendanceDate: { gte: rangeStart, lte: rangeEnd },
    },
    include: {
      records: {
        where: { studentId },
      },
      timetableEntry: {
        include: {
          class: { select: { displayName: true } },
        },
      },
    },
    orderBy: [{ attendanceDate: "asc" }, { createdAt: "asc" }],
  });

  const lateAsPresent = await lateCountsAsPresent();
  const workingDays = sessions.length;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;

  const records: StudentAttendanceDetailRow[] = sessions.map((session) => {
    const record = session.records[0] ?? null;
    const status = (record?.status as AttendanceStatus | undefined) ?? null;
    if (status === "present") presentDays += 1;
    if (status === "absent") absentDays += 1;
    if (status === "late") lateDays += 1;

    const isoDate = formatISODate(session.attendanceDate);
    let subject: string | null = null;
    let classTime: string | null = null;

    if (session.timetableEntry) {
      const timetableEntry = serializeTimetableEntry(session.timetableEntry);
      subject = timetableEntry.subject;
      const schedule = getScheduleForDate(timetableEntry, isoDate);
      if (schedule) {
        classTime = `${formatTime12h(schedule.start_time)} - ${formatTime12h(schedule.end_time)}`;
      }
    }

    return {
      session_id: session.id,
      attendance_date: isoDate,
      subject,
      class_time: classTime,
      status: status ?? "not_marked",
      remarks: record?.remarks ?? null,
    };
  });

  const attendancePercentage = calculateAttendancePercentage({
    presentDays,
    lateDays,
    workingDays,
    lateCountsAsPresent: lateAsPresent,
  });

  return {
    month,
    present_days: presentDays,
    absent_days: absentDays,
    late_days: lateDays,
    working_days: workingDays,
    attendance_percentage: attendancePercentage,
    records,
  };
}

export async function getStudentProfile(
  classId: string,
  studentId: string,
  month?: string,
): Promise<StudentProfile | null> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    include: {
      class: { select: { id: true, displayName: true } },
    },
  });

  if (!student) return null;

  const attendanceMonth = month ?? currentMonth();
  const [attendance, assessmentHistory] = await Promise.all([
    getStudentMonthlyAttendance(classId, studentId, attendanceMonth),
    getStudentAssessmentHistory(classId, studentId),
  ]);

  if (!attendance) return null;

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
      attendance_percentage: attendance.attendance_percentage,
      attendance_month: attendance.month,
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
    attendance,
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
