import type { SyllabusChapterSummary, SyllabusTopic } from "@/lib/types/syllabus";

const TAUGHT_SYLLABUS_STATUSES = new Set(["COMPLETED", "REVISED"]);

export function isSyllabusTopicTaught(
  topic: Pick<SyllabusTopic, "id" | "status">,
  fullyTaughtTopicIds: ReadonlySet<string>,
): boolean {
  if (TAUGHT_SYLLABUS_STATUSES.has(topic.status)) return true;
  return fullyTaughtTopicIds.has(topic.id);
}

export function filterTopicsForDiaryForm(
  topics: SyllabusTopic[],
  fullyTaughtTopicIds: ReadonlySet<string>,
  currentTopicId?: string | null,
): SyllabusTopic[] {
  return topics.filter(
    (topic) =>
      topic.id === currentTopicId ||
      !isSyllabusTopicTaught(topic, fullyTaughtTopicIds),
  );
}

export function filterChaptersForDiaryForm(
  chapters: SyllabusChapterSummary[],
  fullyTaughtTopicIds: ReadonlySet<string>,
  currentChapterId?: string | null,
  currentTopicId?: string | null,
): SyllabusChapterSummary[] {
  return chapters.filter((chapter) => {
    if (chapter.id === currentChapterId) return true;
    return filterTopicsForDiaryForm(
      chapter.topics,
      fullyTaughtTopicIds,
      currentTopicId,
    ).length > 0;
  });
}
