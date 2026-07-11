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

export type ReportsClassOverview = {
  class_id: string;
  display_name: string;
  syllabus_subjects_count: number;
  syllabus_progress_percentage: number | null;
  diary_entries_count: number;
};

export type SyllabusProgressChapterRow = {
  chapter_number: number | null;
  chapter_title: string;
  topics_total: number;
  topics_completed: number;
  topics_in_progress: number;
  topics_pending: number;
  topics_revised: number;
  progress_percentage: number;
};

export type SyllabusProgressReport = {
  class: { id: string; display_name: string };
  subject: { id: string; name: string } | null;
  summary: {
    total_topics: number;
    completed: number;
    in_progress: number;
    pending: number;
    revised: number;
    progress_percentage: number;
  };
  chapters: SyllabusProgressChapterRow[];
};

export type TeachingDiaryReportEntry = {
  entry_date: string;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  topic_taught: string;
  teaching_notes: string | null;
  next_class_plan: string | null;
  diary_status: string;
};

export type TeachingDiaryReport = {
  class: { id: string; display_name: string };
  month: string | null;
  subject: { id: string; name: string } | null;
  entries: TeachingDiaryReportEntry[];
  summary: {
    total_entries: number;
    topics_taught: number;
    partial_topics: number;
    revision_entries: number;
  };
};

export type PendingContinuationItem = {
  entry_date: string;
  topic_title: string | null;
  topic_taught: string;
  next_class_plan: string | null;
};

export type MonthlyAcademicWorkReport = {
  class: { id: string; display_name: string };
  month: string;
  subject: { id: string; name: string } | null;
  topics_taught_this_month: number;
  topics_completed_this_month: number;
  revision_classes: number;
  pending_continuation: PendingContinuationItem[];
  diary_entries: TeachingDiaryReportEntry[];
};
