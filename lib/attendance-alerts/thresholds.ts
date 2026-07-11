import type { AttendanceAlertThresholds } from "@/lib/types/settings";

/** Default thresholds when settings cannot be loaded. */
export const DEFAULT_ATTENDANCE_ALERT_THRESHOLDS: AttendanceAlertThresholds = {
  continuousAbsenceMin: 3,
  lowAttendancePercent: 75,
  frequentAbsenceMin: 4,
};
