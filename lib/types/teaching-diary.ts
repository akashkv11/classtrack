export type DiaryStatus = "TAUGHT" | "PARTIALLY_TAUGHT" | "REVISION" | "CANCELLED";

export type StudentResponse =
  | "GOOD"
  | "AVERAGE"
  | "NEEDS_MORE_PRACTICE"
  | "NOT_RECORDED";

export type SyllabusStatusUpdate =
  | "KEEP_CURRENT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REVISED";

export type TeachingDiarySubjectRef = {
  id: string;
  name: string;
};

export type TeachingDiaryChapterRef = {
  id: string;
  chapter_number: number | null;
  chapter_title: string;
};

export type TeachingDiaryTopicRef = {
  id: string;
  topic_title: string;
  status?: string;
};

export type TeachingDiaryEntrySummary = {
  id: string;
  entry_date: string;
  subject: TeachingDiarySubjectRef | null;
  chapter: TeachingDiaryChapterRef | null;
  topic: TeachingDiaryTopicRef | null;
  topic_taught: string;
  teaching_notes: string | null;
  examples_covered: string | null;
  student_response: StudentResponse | null;
  next_class_plan: string | null;
  homework_given: boolean;
  homework_note: string | null;
  diary_status: DiaryStatus;
  syllabus_status_update: SyllabusStatusUpdate | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type TeachingDiarySummary = {
  total_entries: number;
  topics_completed: number;
  topics_in_progress: number;
  revision_entries: number;
  homework_given: number;
};

export type TeachingDiaryClassOverview = {
  class_id: string;
  display_name: string;
  entries_count: number;
  latest_entry_date: string | null;
};

export type TeachingDiaryListResponse = {
  class_id: string;
  entries: TeachingDiaryEntrySummary[];
  summary: TeachingDiarySummary;
};
