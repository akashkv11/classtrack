import type { SyllabusSubtopic } from "@/lib/types/syllabus";

function formatEnglishList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildTopicTaughtSuggestion(topic: {
  topic_title: string;
  subtopics: SyllabusSubtopic[];
}): string {
  const subtopicTitles = topic.subtopics
    .map((st) => st.subtopic_title.trim())
    .filter(Boolean);

  if (subtopicTitles.length > 0) {
    return `Taught ${formatEnglishList(subtopicTitles)}.`;
  }

  return topic.topic_title.trim();
}
