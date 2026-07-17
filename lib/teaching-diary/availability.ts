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
  currentTopicIds: ReadonlyArray<string> = [],
): SyllabusTopic[] {
  const keep = new Set(currentTopicIds.filter(Boolean));
  return topics.filter(
    (topic) =>
      keep.has(topic.id) || !isSyllabusTopicTaught(topic, fullyTaughtTopicIds),
  );
}

export function filterChaptersForDiaryForm(
  chapters: SyllabusChapterSummary[],
  fullyTaughtTopicIds: ReadonlySet<string>,
  currentChapterId?: string | null,
  currentTopicIds: ReadonlyArray<string> = [],
): SyllabusChapterSummary[] {
  return chapters.filter((chapter) => {
    if (chapter.id === currentChapterId) return true;
    return (
      filterTopicsForDiaryForm(chapter.topics, fullyTaughtTopicIds, currentTopicIds)
        .length > 0
    );
  });
}
