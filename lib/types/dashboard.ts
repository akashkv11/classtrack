export type DashboardTodayItem = {
  entry_id: string;
  period_number: number;
  class_id: string;
  class_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  schedule_type: "one_time" | "repeating";
  has_time_exception: boolean;
  attendance_status: "marked" | "not_marked";
  attendance_session_id: string | null;
  attendance_present: number | null;
  attendance_absent: number | null;
  attendance_late: number | null;
  teaching_diary_status: "pending" | "written";
  teaching_diary_entry_id: string | null;
  last_topic_taught: string | null;
  next_class_plan: string | null;
  suggested_next_topic: string | null;
  open_alerts_count: number;
  top_alert_preview: string | null;
};

export type DashboardClassCard = {
  class_id: string;
  display_name: string;
  student_count: number;
  attendance_marked_today: boolean;
  attendance_session_id: string | null;
  attendance_present: number | null;
  attendance_absent: number | null;
  diary_added_today: boolean;
  last_topic_taught: string | null;
  next_class_plan: string | null;
  syllabus_progress_percentage: number | null;
  important_topics_pending: number;
  open_attendance_alerts: number;
  open_student_notes: number;
  open_parent_follow_ups: number;
  latest_assessment_name: string | null;
  latest_assessment_average: number | null;
  latest_assessment_max_marks: number | null;
  latest_assessment_below_40_count: number | null;
};

export type DashboardFollowUpSummary = {
  open_student_notes: number;
  overdue_student_notes: number;
  open_parent_follow_ups: number;
  overdue_parent_follow_ups: number;
  open_attendance_alerts: number;
};

export type DashboardTodayCompliance = {
  scheduled_classes: number;
  attendance_pending: number;
  diary_pending: number;
};

export type DashboardData = {
  today: string;
  active_year_name: string;
  low_marks_threshold_percent: number;
  today_items: DashboardTodayItem[];
  today_compliance: DashboardTodayCompliance;
  classes: DashboardClassCard[];
  follow_ups: DashboardFollowUpSummary;
};
