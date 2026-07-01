import type { TopicStatus } from "./progress";

export function applyStatusDates(
  status: TopicStatus,
  existing: {
    startedAt?: Date | null;
    completedAt?: Date | null;
    revisedAt?: Date | null;
  },
): {
  startedAt?: Date | null;
  completedAt?: Date | null;
  revisedAt?: Date | null;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const updates: {
    startedAt?: Date | null;
    completedAt?: Date | null;
    revisedAt?: Date | null;
  } = {};

  if (status === "IN_PROGRESS" && !existing.startedAt) {
    updates.startedAt = today;
  }
  if (status === "COMPLETED" && !existing.completedAt) {
    updates.completedAt = today;
  }
  if (status === "REVISED" && !existing.revisedAt) {
    updates.revisedAt = today;
  }

  return updates;
}
