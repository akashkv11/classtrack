export function mapSubtopicsFromDb(subtopics: unknown) {
  if (!Array.isArray(subtopics)) return [];
  return subtopics.map((st) => {
    const item = st as Record<string, unknown>;
    return {
      subtopic_title: String(item.subtopicTitle ?? item.subtopic_title ?? ""),
      nested_subtopics: Array.isArray(item.nestedSubtopics ?? item.nested_subtopics)
        ? ((item.nestedSubtopics ?? item.nested_subtopics) as string[])
        : [],
    };
  });
}

export function flattenSubtopicLabels(
  subtopics: { subtopic_title: string; nested_subtopics: string[] }[],
): string[] {
  const labels: string[] = [];

  for (const subtopic of subtopics) {
    const title = subtopic.subtopic_title.trim();
    if (title) labels.push(title);

    for (const nested of subtopic.nested_subtopics) {
      const nestedTitle = nested.trim();
      if (nestedTitle) labels.push(nestedTitle);
    }
  }

  return labels;
}

export function labelsToTopicBullets(labels: string[]): string[] {
  return labels.map((label) => `• ${label}`);
}

export function parseSubtopicsCoveredFromDb(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function serializeSubtopicsCoveredForDb(labels: string[]): string[] {
  return labels.map((label) => label.trim()).filter(Boolean);
}
