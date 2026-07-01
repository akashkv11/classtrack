export function normalizeImportStatus(value: unknown): string {
  if (typeof value !== "string") return "NOT_STARTED";
  const map: Record<string, string> = {
    "not started": "NOT_STARTED",
    "in progress": "IN_PROGRESS",
    completed: "COMPLETED",
    revised: "REVISED",
    skipped: "SKIPPED",
  };
  const key = value.trim().toLowerCase();
  return map[key] ?? value.toUpperCase().replace(/ /g, "_");
}

export function normalizeImportPriority(value: unknown): string {
  if (typeof value !== "string") return "NORMAL";
  const map: Record<string, string> = {
    low: "LOW",
    normal: "NORMAL",
    important: "IMPORTANT",
    "exam important": "EXAM_IMPORTANT",
  };
  const key = value.trim().toLowerCase();
  return map[key] ?? value.toUpperCase().replace(/ /g, "_");
}

export function parseEstimatedClasses(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

export function parseMultilineSubtopics(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((subtopic_title) => ({ subtopic_title, nested_subtopics: [] as string[] }));
}
