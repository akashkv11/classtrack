import type { NoteCategory } from "@/lib/types/student-note";

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  ACADEMIC: "Academic",
  ATTENDANCE: "Attendance",
  BEHAVIOUR: "Behaviour",
  IMPROVEMENT: "Improvement",
  PARENT_FOLLOW_UP: "Parent Follow-up",
  GENERAL: "General",
};

export const NOTE_CATEGORIES = Object.keys(NOTE_CATEGORY_LABELS) as NoteCategory[];

export const NOTE_STATUS_LABELS = {
  OPEN: "Open",
  CLOSED: "Closed",
} as const;

export function noteStatusBadgeVariant(
  status: keyof typeof NOTE_STATUS_LABELS,
): "warning" | "success" {
  return status === "OPEN" ? "warning" : "success";
}
