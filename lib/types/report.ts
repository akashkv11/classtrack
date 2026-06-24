export type ReportStudent = {
  roll_no: number;
  full_name: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
};

export type MonthlyReport = {
  class: { id: string; display_name: string };
  month: string;
  working_days: number;
  students: ReportStudent[];
};
