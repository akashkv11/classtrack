export type CommunicationType =
  | "WHATSAPP"
  | "PHONE_CALL"
  | "IN_PERSON"
  | "SMS"
  | "OTHER";

export type CommunicationReason =
  | "ATTENDANCE"
  | "LOW_MARKS"
  | "BEHAVIOUR"
  | "HOMEWORK"
  | "IMPROVEMENT"
  | "GENERAL";

export type CommunicationStatus =
  | "OPEN"
  | "COMPLETED"
  | "NO_RESPONSE"
  | "FOLLOW_UP_NEEDED";

export type LinkedStudentNoteRef = {
  id: string;
  note_date: string;
  category: string;
  note_text: string;
};

export type ParentCommunicationSummary = {
  id: string;
  communication_date: string;
  communication_type: CommunicationType;
  reason: CommunicationReason;
  summary: string;
  linked_note: LinkedStudentNoteRef | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  status: CommunicationStatus;
  created_at: string;
  updated_at: string;
};

export type ParentCommunicationsListResponse = {
  student_id: string;
  class_id: string;
  communications: ParentCommunicationSummary[];
};

export type ParentCommunicationClassOverview = {
  class_id: string;
  display_name: string;
  student_count: number;
  communications_count: number;
  open_follow_ups_count: number;
};

export type StudentNoteOption = {
  id: string;
  note_date: string;
  category: string;
  note_text: string;
};
