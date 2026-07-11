import type {
  CommunicationReason,
  CommunicationStatus,
  CommunicationType,
} from "@/lib/types/parent-communication";

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  WHATSAPP: "WhatsApp",
  PHONE_CALL: "Phone Call",
  IN_PERSON: "In Person",
  SMS: "SMS",
  OTHER: "Other",
};

export const COMMUNICATION_TYPES = Object.keys(
  COMMUNICATION_TYPE_LABELS,
) as CommunicationType[];

export const COMMUNICATION_REASON_LABELS: Record<CommunicationReason, string> = {
  ATTENDANCE: "Attendance",
  LOW_MARKS: "Low Marks",
  BEHAVIOUR: "Behaviour",
  HOMEWORK: "Homework",
  IMPROVEMENT: "Improvement",
  GENERAL: "General",
};

export const COMMUNICATION_REASONS = Object.keys(
  COMMUNICATION_REASON_LABELS,
) as CommunicationReason[];

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
  OPEN: "Open",
  COMPLETED: "Completed",
  NO_RESPONSE: "No Response",
  FOLLOW_UP_NEEDED: "Follow-up Needed",
};

export const COMMUNICATION_STATUSES = Object.keys(
  COMMUNICATION_STATUS_LABELS,
) as CommunicationStatus[];

export function communicationStatusBadgeVariant(
  status: CommunicationStatus,
): "warning" | "success" | "neutral" | "info" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "NO_RESPONSE":
      return "neutral";
    case "FOLLOW_UP_NEEDED":
      return "info";
    default:
      return "warning";
  }
}
