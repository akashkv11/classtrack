import type { StudentAssessmentHistoryEntry } from "./assessment";

export type StudentProfileAttendance = {
  month: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  working_days: number;
  attendance_percentage: number;
};

export type StudentProfileLatestAssessment = {
  assessment_id: string;
  assessment_name: string;
  marks_obtained: number | null;
  max_marks: number;
  assessment_date: string;
};

export type StudentProfileSummary = {
  attendance_percentage: number;
  attendance_month: string;
  average_marks_percentage: number | null;
  latest_assessment: StudentProfileLatestAssessment | null;
};

export type StudentProfile = {
  student: {
    id: string;
    roll_no: number;
    full_name: string;
    admission_no: string | null;
    email: string | null;
    parent_phone: string | null;
    is_active: boolean;
  };
  class: {
    id: string;
    display_name: string;
  };
  summary: StudentProfileSummary;
  attendance: StudentProfileAttendance;
  assessments: StudentAssessmentHistoryEntry[];
};

export type StudentProfileClassOverview = {
  class_id: string;
  display_name: string;
  student_count: number;
};

export type StudentProfileListItem = {
  id: string;
  roll_no: number;
  full_name: string;
  is_active: boolean;
};
