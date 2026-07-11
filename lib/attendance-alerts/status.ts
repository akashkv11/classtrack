import type { AlertStatus, AlertType } from "@/lib/types/attendance-alert";

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  CONTINUOUS_ABSENCE: "Continuous Absence",
  LOW_ATTENDANCE: "Low Attendance",
  FREQUENT_ABSENCE: "Frequent Absence",
};

export const ALERT_TYPES = Object.keys(ALERT_TYPE_LABELS) as AlertType[];

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  IGNORED: "Ignored",
};

export const ALERT_STATUSES = Object.keys(ALERT_STATUS_LABELS) as AlertStatus[];

export function alertStatusBadgeVariant(
  status: AlertStatus,
): "warning" | "success" | "neutral" | "info" {
  switch (status) {
    case "RESOLVED":
      return "success";
    case "IGNORED":
      return "neutral";
    case "IN_PROGRESS":
      return "info";
    default:
      return "warning";
  }
}

export function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNum - 1, 1));
}
