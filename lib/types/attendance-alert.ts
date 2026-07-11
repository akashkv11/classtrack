export type AlertType =
  | "CONTINUOUS_ABSENCE"
  | "LOW_ATTENDANCE"
  | "FREQUENT_ABSENCE";

export type AlertStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED";

export type AttendanceAlertSummary = {
  alert_key: string;
  student_id: string;
  roll_no: string;
  full_name: string;
  alert_type: AlertType;
  month: string;
  title: string;
  message: string;
  detail_dates: string[];
  attendance_percentage?: number;
  absent_days_count?: number;
  streak_length?: number;
  status: AlertStatus;
};

export type AttendanceAlertsListResponse = {
  month: string;
  working_days: number;
  alerts: AttendanceAlertSummary[];
  summary: {
    total: number;
    open: number;
    low_attendance: number;
    continuous_absence: number;
    frequent_absence: number;
  };
};

export type AttendanceAlertsClassOverview = {
  class_id: string;
  display_name: string;
  student_count: number;
  open_alerts_count: number;
  total_alerts_count: number;
};

export type AttendanceAlertStatusUpdateResponse = {
  success: true;
  alert: AttendanceAlertSummary;
};
