export type NoteCategory =
  | "ACADEMIC"
  | "ATTENDANCE"
  | "BEHAVIOUR"
  | "IMPROVEMENT"
  | "PARENT_FOLLOW_UP"
  | "GENERAL";

export type NoteStatus = "OPEN" | "CLOSED";

export type StudentNoteSummary = {
  id: string;
  note_date: string;
  category: NoteCategory;
  note_text: string;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  status: NoteStatus;
  created_at: string;
  updated_at: string;
};

export type StudentNotesListResponse = {
  student_id: string;
  class_id: string;
  notes: StudentNoteSummary[];
};

export type StudentNotesClassOverview = {
  class_id: string;
  display_name: string;
  student_count: number;
  notes_count: number;
  open_notes_count: number;
};
