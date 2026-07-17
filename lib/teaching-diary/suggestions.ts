import type { SyllabusSubtopic } from "@/lib/types/syllabus";
import type { DiaryStatus } from "@/lib/types/teaching-diary";

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

export function buildTopicTaughtSuggestionFromTopics(
  topics: Array<{ topic_title: string; subtopics: SyllabusSubtopic[] }>,
): string {
  if (topics.length === 0) return "";
  if (topics.length === 1) return buildTopicTaughtSuggestion(topics[0]);
  return topics.map((topic) => topic.topic_title.trim()).filter(Boolean).join("; ");
}

export function buildTopicTaughtFromSubtopics(selectedLabels: string[]): string {
  const labels = selectedLabels.map((label) => label.trim()).filter(Boolean);
  if (labels.length === 0) return "";
  return `Taught ${formatEnglishList(labels)}.`;
}

export function suggestDiaryStatusFromSubtopics(
  allLabels: string[],
  selectedLabels: string[],
): DiaryStatus | null {
  if (allLabels.length === 0) return null;
  if (selectedLabels.length === 0) return "PARTIALLY_TAUGHT";
  if (selectedLabels.length >= allLabels.length) return "TAUGHT";
  return "PARTIALLY_TAUGHT";
}
