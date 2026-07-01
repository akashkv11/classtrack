import type { DiaryStatus, SyllabusStatusUpdate } from "@/lib/types/teaching-diary";

export const DIARY_STATUS_LABELS: Record<DiaryStatus, string> = {
  TAUGHT: "Taught",
  PARTIALLY_TAUGHT: "Partially Taught",
  REVISION: "Revision",
  CANCELLED: "Cancelled",
};

export const STUDENT_RESPONSE_LABELS = {
  GOOD: "Good",
  AVERAGE: "Average",
  NEEDS_MORE_PRACTICE: "Needs More Practice",
  NOT_RECORDED: "Not Recorded",
} as const;

export const SYLLABUS_STATUS_UPDATE_LABELS: Record<SyllabusStatusUpdate, string> = {
  KEEP_CURRENT: "Keep current status",
  IN_PROGRESS: "Mark In Progress",
  COMPLETED: "Mark Completed",
  REVISED: "Mark Revised",
};

export function suggestSyllabusStatusUpdate(
  diaryStatus: DiaryStatus,
): SyllabusStatusUpdate {
  switch (diaryStatus) {
    case "PARTIALLY_TAUGHT":
      return "IN_PROGRESS";
    case "TAUGHT":
      return "COMPLETED";
    case "REVISION":
      return "REVISED";
    default:
      return "KEEP_CURRENT";
  }
}

export function diaryStatusBadgeVariant(
  status: DiaryStatus,
): "default" | "success" | "warning" | "info" | "danger" {
  switch (status) {
    case "TAUGHT":
      return "success";
    case "PARTIALLY_TAUGHT":
      return "warning";
    case "REVISION":
      return "info";
    case "CANCELLED":
      return "danger";
    default:
      return "default";
  }
}
