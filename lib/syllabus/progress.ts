export type TopicStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REVISED"
  | "SKIPPED";

export function calculateTopicProgress(topics: { status: string }[]): number {
  const total = topics.length;
  const completed = topics.filter(
    (topic) => topic.status === "COMPLETED" || topic.status === "REVISED",
  ).length;

  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function getSyllabusSummary(topics: { status: string }[]) {
  const completed = topics.filter((t) => t.status === "COMPLETED").length;
  const revised = topics.filter((t) => t.status === "REVISED").length;

  return {
    total: topics.length,
    notStarted: topics.filter((t) => t.status === "NOT_STARTED").length,
    inProgress: topics.filter((t) => t.status === "IN_PROGRESS").length,
    completed,
    revised,
    skipped: topics.filter((t) => t.status === "SKIPPED").length,
    progressPercentage:
      topics.length === 0
        ? 0
        : Math.round(((completed + revised) / topics.length) * 100),
  };
}

export function countSubtopics(
  subtopics: { nestedSubtopics?: string[] }[] | null | undefined,
): number {
  if (!subtopics?.length) return 0;
  return subtopics.reduce(
    (sum, st) => sum + 1 + (st.nestedSubtopics?.length ?? 0),
    0,
  );
}

export const STATUS_LABELS: Record<TopicStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REVISED: "Revised",
  SKIPPED: "Skipped",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  IMPORTANT: "Important",
  EXAM_IMPORTANT: "Exam Important",
};

export function mapSummaryToJson(summary: ReturnType<typeof getSyllabusSummary>) {
  return {
    total: summary.total,
    not_started: summary.notStarted,
    in_progress: summary.inProgress,
    completed: summary.completed,
    revised: summary.revised,
    skipped: summary.skipped,
    progress_percentage: summary.progressPercentage,
  };
}

export function statusBadgeVariant(
  status: string,
): "neutral" | "info" | "success" | "warning" {
  switch (status) {
    case "IN_PROGRESS":
      return "info";
    case "COMPLETED":
    case "REVISED":
      return "success";
    case "SKIPPED":
      return "warning";
    default:
      return "neutral";
  }
}
