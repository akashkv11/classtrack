export type SyllabusSubtopic = {
  subtopic_title: string;
  nested_subtopics: string[];
};

export type SyllabusTopic = {
  id: string;
  topic_title: string;
  status: string;
  priority: string;
  estimated_classes: number | null;
  target_date?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  revised_at?: string | null;
  remarks: string | null;
  needs_manual_review?: boolean;
  display_order?: number;
  subtopics: SyllabusSubtopic[];
};

export type SyllabusStatusSummary = {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  revised: number;
  skipped: number;
  progress_percentage: number;
};

export type SyllabusSubjectSummary = {
  id: string;
  subject_name: string;
  stream?: string | null;
  textbook_name?: string | null;
  board?: string | null;
  academic_year?: string | null;
  chapters_count: number;
  topics_count: number;
  completed_topics_count: number;
  progress_percentage: number;
};

export type SyllabusChapterSummary = {
  id: string;
  chapter_number: number | null;
  chapter_title: string;
  chapter_summary: string | null;
  display_order: number;
  progress_percentage: number;
  topics_count: number;
  subtopics_count: number;
  status_summary: SyllabusStatusSummary;
  topics: SyllabusTopic[];
};

export type SyllabusSubjectDetail = {
  id: string;
  class_id: string;
  subject_name: string;
  stream: string | null;
  textbook_name: string | null;
  board: string | null;
  academic_year: string | null;
  summary: SyllabusStatusSummary & {
    chapters_count: number;
    topics_count: number;
    subtopics_count: number;
    not_started_count: number;
    in_progress_count: number;
    completed_count: number;
    revised_count: number;
    skipped_count: number;
  };
  chapters: SyllabusChapterSummary[];
};

export type SyllabusChapterDetail = {
  id: string;
  class_id: string;
  subject_id: string;
  subject_name: string;
  chapter_number: number | null;
  chapter_title: string;
  chapter_summary: string | null;
  display_order: number;
  metadata: unknown;
  progress: SyllabusStatusSummary;
  topics: SyllabusTopic[];
};

export type SyllabusChapterOption = {
  id: string;
  chapter_number: number | null;
  chapter_title: string;
};

export type SyllabusImportPreviewData = {
  detected: {
    class_grade: string | null;
    stream: string | null;
    subject: string | null;
    textbook_name: string | null;
    board: string | null;
  };
  counts: {
    chapters: number;
    topics: number;
    subtopics: number;
  };
  warnings: string[];
  chapters: {
    chapter_number: number | null;
    chapter_title: string;
    topics_count: number;
    subtopics_count: number;
  }[];
  existing_subject?: { id: string; subject_name: string } | null;
};

export type SyllabusExistingSubject = {
  id: string;
  subject_name: string;
};

export type SyllabusClassOverview = {
  class_id: string;
  display_name: string;
  subjects_count: number;
  topics_count: number;
  progress_percentage: number;
  subjects: SyllabusSubjectSummary[];
};
