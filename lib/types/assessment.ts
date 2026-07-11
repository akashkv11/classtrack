export type AssessmentType =
  | "CLASS_TEST"
  | "UNIT_TEST"
  | "MODEL_EXAM"
  | "PRACTICAL"
  | "REVISION_TEST"
  | "ASSIGNMENT"
  | "OTHER";

export type AssessmentTopicRef = {
  id: string;
  topic_title: string;
  chapter_title: string | null;
};

export type AssessmentSummary = {
  id: string;
  name: string;
  assessment_type: AssessmentType;
  assessment_date: string;
  max_marks: number;
  subject: { id: string; name: string };
  chapter: { id: string; chapter_title: string } | null;
  topics: AssessmentTopicRef[];
  remarks: string | null;
  marks_entered_count: number;
  student_count: number;
  class_average: number | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentDetail = AssessmentSummary & {
  result_summary: AssessmentResultSummary;
};

export type AssessmentResultSummary = {
  class_average: number | null;
  highest: number | null;
  lowest: number | null;
  below_40_percent_count: number;
  absent_count: number;
  entered_count: number;
  total_students: number;
};

export type AssessmentMarkRow = {
  student_id: string;
  roll_no: number;
  full_name: string;
  marks_obtained: number | null;
  remarks: string | null;
};

export type AssessmentMarksResponse = {
  assessment: AssessmentSummary;
  records: AssessmentMarkRow[];
  summary: AssessmentResultSummary;
};

export type AssessmentListResponse = {
  class_id: string;
  assessments: AssessmentSummary[];
};

export type AssessmentClassOverview = {
  class_id: string;
  display_name: string;
  assessments_count: number;
  latest_assessment_date: string | null;
};

export type StudentAssessmentHistoryEntry = {
  assessment_id: string;
  assessment_name: string;
  assessment_type: AssessmentType;
  assessment_date: string;
  subject_name: string;
  max_marks: number;
  marks_obtained: number | null;
  percentage: number | null;
  remarks: string | null;
};

export type StudentAssessmentHistory = {
  student_id: string;
  student_name: string;
  roll_no: number;
  entries: StudentAssessmentHistoryEntry[];
  average_percentage: number | null;
};
