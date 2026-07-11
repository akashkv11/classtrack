import {
  calculateAttendancePercentage,
  type AttendanceStatus,
} from "@/lib/attendance";
import type { AttendanceAlertThresholds } from "@/lib/types/settings";
import { formatISODate } from "@/lib/dates";
import type { AttendanceAlertSummary } from "@/lib/types/attendance-alert";

type StudentInfo = {
  id: string;
  rollNo: string;
  fullName: string;
};

type SessionWithRecords = {
  attendanceDate: Date;
  records: { studentId: string; status: string }[];
};

type DetectedAlert = Omit<AttendanceAlertSummary, "status">;

function buildContinuousAbsenceKey(studentId: string, dates: string[]): string {
  return `continuous_absence:${studentId}:${dates.join(",")}`;
}

function buildLowAttendanceKey(studentId: string, month: string): string {
  return `low_attendance:${studentId}:${month}`;
}

function buildFrequentAbsenceKey(studentId: string, month: string): string {
  return `frequent_absence:${studentId}:${month}`;
}

function formatAbsentDates(dates: string[]): string {
  return dates
    .map((date) => {
      const [year, month, day] = date.split("-");
      return `${day} ${new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
        new Date(Number(year), Number(month) - 1, 1),
      )}`;
    })
    .join(", ");
}

function detectContinuousAbsenceAlerts(
  students: StudentInfo[],
  sessions: SessionWithRecords[],
  month: string,
  thresholds: AttendanceAlertThresholds,
): DetectedAlert[] {
  const alerts: DetectedAlert[] = [];
  const minStreak = thresholds.continuousAbsenceMin;

  for (const student of students) {
    let streakDates: string[] = [];

    function pushStreakIfNeeded(dates: string[]) {
      if (dates.length < minStreak) return;

      const formattedDates = formatAbsentDates(dates);
      alerts.push({
        alert_key: buildContinuousAbsenceKey(student.id, dates),
        student_id: student.id,
        roll_no: student.rollNo,
        full_name: student.fullName,
        alert_type: "CONTINUOUS_ABSENCE",
        month,
        title: `Absent for ${dates.length} continuous classes`,
        message: `${student.fullName} was absent for ${dates.length} continuous classes (${formattedDates}).`,
        detail_dates: [...dates],
        streak_length: dates.length,
      });
    }

    for (const session of sessions) {
      const record = session.records.find((r) => r.studentId === student.id);
      if (!record || record.status !== "absent") {
        pushStreakIfNeeded(streakDates);
        streakDates = [];
        continue;
      }

      streakDates.push(formatISODate(session.attendanceDate));
    }

    pushStreakIfNeeded(streakDates);
  }

  return alerts;
}

function detectMonthlyAlerts(
  students: StudentInfo[],
  sessions: SessionWithRecords[],
  month: string,
  lateCountsAsPresent: boolean,
  thresholds: AttendanceAlertThresholds,
): DetectedAlert[] {
  const alerts: DetectedAlert[] = [];
  const workingDays = sessions.length;

  if (workingDays === 0) return alerts;

  for (const student of students) {
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    const absentDates: string[] = [];

    for (const session of sessions) {
      const record = session.records.find((r) => r.studentId === student.id);
      if (!record) continue;

      const status = record.status as AttendanceStatus;
      if (status === "present") presentDays += 1;
      if (status === "absent") {
        absentDays += 1;
        absentDates.push(formatISODate(session.attendanceDate));
      }
      if (status === "late") lateDays += 1;
    }

    const attendancePercentage = calculateAttendancePercentage({
      presentDays,
      lateDays,
      workingDays,
      lateCountsAsPresent,
    });

    if (attendancePercentage < thresholds.lowAttendancePercent) {
      alerts.push({
        alert_key: buildLowAttendanceKey(student.id, month),
        student_id: student.id,
        roll_no: student.rollNo,
        full_name: student.fullName,
        alert_type: "LOW_ATTENDANCE",
        month,
        title: `Attendance is ${attendancePercentage}%`,
        message: `${student.fullName}'s attendance is ${attendancePercentage}% for this month.`,
        detail_dates: [],
        attendance_percentage: attendancePercentage,
      });
    }

    if (absentDays >= thresholds.frequentAbsenceMin) {
      alerts.push({
        alert_key: buildFrequentAbsenceKey(student.id, month),
        student_id: student.id,
        roll_no: student.rollNo,
        full_name: student.fullName,
        alert_type: "FREQUENT_ABSENCE",
        month,
        title: `Absent ${absentDays} times this month`,
        message: `${student.fullName} was absent ${absentDays} times this month.`,
        detail_dates: absentDates,
        absent_days_count: absentDays,
      });
    }
  }

  return alerts;
}

export function detectAttendanceAlerts(options: {
  students: StudentInfo[];
  sessions: SessionWithRecords[];
  month: string;
  lateCountsAsPresent: boolean;
  thresholds: AttendanceAlertThresholds;
}): DetectedAlert[] {
  const { students, sessions, month, lateCountsAsPresent, thresholds } = options;

  const continuous = detectContinuousAbsenceAlerts(students, sessions, month, thresholds);
  const monthly = detectMonthlyAlerts(
    students,
    sessions,
    month,
    lateCountsAsPresent,
    thresholds,
  );

  const byKey = new Map<string, DetectedAlert>();
  for (const alert of [...continuous, ...monthly]) {
    byKey.set(alert.alert_key, alert);
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const nameCompare = a.full_name.localeCompare(b.full_name);
    if (nameCompare !== 0) return nameCompare;
    return a.alert_type.localeCompare(b.alert_type);
  });
}

export function buildAlertDetailsLine(alert: AttendanceAlertSummary): string | null {
  if (alert.alert_type === "CONTINUOUS_ABSENCE" && alert.detail_dates.length > 0) {
    return `Absent on ${formatAbsentDates(alert.detail_dates)}`;
  }

  if (alert.alert_type === "FREQUENT_ABSENCE" && alert.detail_dates.length > 0) {
    return `Absent on ${formatAbsentDates(alert.detail_dates)}`;
  }

  if (alert.alert_type === "LOW_ATTENDANCE" && alert.attendance_percentage !== undefined) {
    return `Attendance: ${alert.attendance_percentage}%`;
  }

  return null;
}

export { buildContinuousAbsenceKey, buildFrequentAbsenceKey, buildLowAttendanceKey };
