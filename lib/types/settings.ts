export type SettingsClassSubject = {
  class_id: string;
  display_name: string;
  subjects: { id: string; name: string }[];
};

export type SettingsData = {
  academic_years: { id: string; name: string; is_active: boolean }[];
  classes: SettingsClassSubject[];
  settings: {
    message_signature: string;
    late_counts_as_present: boolean;
    low_attendance_threshold: number;
    continuous_absence_threshold: number;
    monthly_absence_threshold: number;
    low_marks_threshold_percent: number;
    teacher_name: string;
    institution_name: string;
    report_title: string;
    report_footer: string;
  };
  communication: {
    parent_reasons: string[];
    note_categories: string[];
  };
};

export type ReportSettings = {
  teacher_name: string;
  institution_name: string;
  report_title: string;
  message_signature: string;
  report_footer: string;
};

export type AttendanceAlertThresholds = {
  lowAttendancePercent: number;
  continuousAbsenceMin: number;
  frequentAbsenceMin: number;
};
