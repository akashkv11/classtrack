import type { ComponentProps } from "react";
import Badge from "@/components/ui/badge";

export type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export type StatusBadgeConfig = {
  label: string;
  variant: BadgeVariant;
};

export function attendanceMarkedStatus(marked: boolean): StatusBadgeConfig {
  return marked
    ? { label: "Marked", variant: "success" }
    : { label: "Not Marked", variant: "warning" };
}

export function diaryAddedStatus(added: boolean): StatusBadgeConfig {
  return added
    ? { label: "Added", variant: "success" }
    : { label: "Not Added", variant: "warning" };
}

export function syllabusTopicStatus(status: string): StatusBadgeConfig {
  switch (status) {
    case "IN_PROGRESS":
      return { label: "In Progress", variant: "info" };
    case "COMPLETED":
      return { label: "Completed", variant: "success" };
    case "REVISED":
      return { label: "Revised", variant: "success" };
    case "SKIPPED":
      return { label: "Skipped", variant: "warning" };
    default:
      return { label: "Not Started", variant: "neutral" };
  }
}

export function diaryEntryStatus(status: string): StatusBadgeConfig {
  switch (status) {
    case "TAUGHT":
      return { label: "Taught", variant: "success" };
    case "PARTIALLY_TAUGHT":
      return { label: "Partially Taught", variant: "info" };
    case "REVISION":
      return { label: "Revision", variant: "warning" };
    default:
      return { label: status, variant: "neutral" };
  }
}

export function alertStatus(status: string): StatusBadgeConfig {
  switch (status) {
    case "RESOLVED":
      return { label: "Resolved", variant: "success" };
    case "IGNORED":
      return { label: "Ignored", variant: "neutral" };
    case "IN_PROGRESS":
      return { label: "In Progress", variant: "info" };
    default:
      return { label: "Open", variant: "warning" };
  }
}

export function noteStatus(status: string): StatusBadgeConfig {
  return status === "CLOSED"
    ? { label: "Closed", variant: "success" }
    : { label: "Open", variant: "warning" };
}

export function parentCommunicationStatus(status: string): StatusBadgeConfig {
  switch (status) {
    case "COMPLETED":
      return { label: "Completed", variant: "success" };
    case "NO_RESPONSE":
      return { label: "No Response", variant: "neutral" };
    case "FOLLOW_UP_NEEDED":
      return { label: "Follow-up Needed", variant: "info" };
    default:
      return { label: "Open", variant: "warning" };
  }
}

export function countStatus(count: number, singular: string, plural?: string): StatusBadgeConfig {
  if (count === 0) {
    return { label: "None", variant: "success" };
  }
  const label = count === 1 ? `1 ${singular}` : `${count} ${plural ?? `${singular}s`}`;
  return { label, variant: "warning" };
}
