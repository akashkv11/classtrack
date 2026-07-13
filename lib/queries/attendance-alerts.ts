import { prisma } from "@/lib/db";
import { detectAttendanceAlerts } from "@/lib/attendance-alerts/detect";
import { endOfMonth, startOfMonth } from "@/lib/dates";
import { getStoredAttendanceAlertCountsForClass } from "@/lib/queries/class-summaries";
import { getActiveClasses } from "@/lib/queries/classes";
import { getAttendanceAlertThresholds, lateCountsAsPresent } from "@/lib/settings";
import type {
  AlertStatus,
  AlertType,
  AttendanceAlertSummary,
  AttendanceAlertsClassOverview,
  AttendanceAlertsListResponse,
} from "@/lib/types/attendance-alert";

function isOpenStatus(status: AlertStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS";
}

function buildSummary(alerts: AttendanceAlertSummary[]) {
  return {
    total: alerts.length,
    open: alerts.filter((alert) => isOpenStatus(alert.status)).length,
    low_attendance: alerts.filter((a) => a.alert_type === "LOW_ATTENDANCE").length,
    continuous_absence: alerts.filter((a) => a.alert_type === "CONTINUOUS_ABSENCE")
      .length,
    frequent_absence: alerts.filter((a) => a.alert_type === "FREQUENT_ABSENCE").length,
  };
}

export async function getAttendanceAlertsForClass(
  classId: string,
  month: string,
  filters?: {
    alertType?: AlertType | "ALL";
    status?: AlertStatus | "ALL";
  },
): Promise<AttendanceAlertsListResponse | null> {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return null;

  const rangeStart = startOfMonth(year, monthNum);
  const rangeEnd = endOfMonth(year, monthNum);

  const [students, sessions, statusRecords, lateAsPresent, thresholds] = await Promise.all([
    prisma.student.findMany({
      where: { classId, isActive: true },
      orderBy: { rollNo: "asc" },
      select: { id: true, rollNo: true, fullName: true },
    }),
    prisma.attendanceSession.findMany({
      where: {
        classId,
        attendanceDate: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        records: {
          select: { studentId: true, status: true },
        },
      },
      orderBy: { attendanceDate: "asc" },
    }),
    prisma.attendanceAlertStatus.findMany({
      where: { classId, month },
    }),
    lateCountsAsPresent(),
    getAttendanceAlertThresholds(),
  ]);

  const statusByKey = new Map(
    statusRecords.map((record) => [record.alertKey, record.status as AlertStatus]),
  );

  const detected = detectAttendanceAlerts({
    students: students.map((student) => ({
      id: student.id,
      rollNo: String(student.rollNo),
      fullName: student.fullName,
    })),
    sessions,
    month,
    lateCountsAsPresent: lateAsPresent,
    thresholds,
  });

  let alerts: AttendanceAlertSummary[] = detected.map((alert) => ({
    ...alert,
    status: statusByKey.get(alert.alert_key) ?? "OPEN",
  }));

  const alertTypeFilter = filters?.alertType ?? "ALL";
  const statusFilter = filters?.status ?? "OPEN";

  if (alertTypeFilter !== "ALL") {
    alerts = alerts.filter((alert) => alert.alert_type === alertTypeFilter);
  }

  if (statusFilter !== "ALL") {
    alerts = alerts.filter((alert) => alert.status === statusFilter);
  }

  return {
    month,
    working_days: sessions.length,
    alerts,
    summary: buildSummary(alerts),
  };
}

export async function upsertAttendanceAlertStatus(options: {
  classId: string;
  studentId: string;
  alertKey: string;
  alertType: AlertType;
  month: string;
  status: AlertStatus;
}): Promise<void> {
  await prisma.attendanceAlertStatus.upsert({
    where: {
      classId_alertKey: {
        classId: options.classId,
        alertKey: options.alertKey,
      },
    },
    create: {
      classId: options.classId,
      studentId: options.studentId,
      alertKey: options.alertKey,
      alertType: options.alertType,
      month: options.month,
      status: options.status,
    },
    update: {
      status: options.status,
    },
  });
}

export async function getAttendanceAlertsOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: AttendanceAlertsClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();
  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const [studentCount, alertCounts] = await Promise.all([
        prisma.student.count({ where: { classId: cls.id, isActive: true } }),
        getStoredAttendanceAlertCountsForClass(cls.id, month),
      ]);

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        student_count: studentCount,
        open_alerts_count: alertCounts.openAlertsCount,
        total_alerts_count: alertCounts.totalAlertsCount,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
