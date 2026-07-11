import { prisma } from "@/lib/db";
import { formatISODate } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import type {
  SyllabusChapterDetail,
  SyllabusClassOverview,
  SyllabusExistingSubject,
  SyllabusSubjectDetail,
  SyllabusSubjectSummary,
  SyllabusTopic,
} from "@/lib/types/syllabus";
import { countSubtopics, getSyllabusSummary, mapSummaryToJson } from "@/lib/syllabus/progress";
import { mapSubtopicsFromDb } from "@/lib/syllabus/subtopics";

type DbTopic = {
  id: string;
  topicTitle: string;
  subtopics: unknown;
  status: string;
  priority: string;
  estimatedClasses: number | null;
  targetDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  revisedAt: Date | null;
  remarks: string | null;
  needsManualReview: boolean;
  displayOrder: number;
};

export { mapSubtopicsFromDb } from "@/lib/syllabus/subtopics";

export function mapTopicToJson(topic: DbTopic): SyllabusTopic {
  return {
    id: topic.id,
    topic_title: topic.topicTitle,
    status: topic.status,
    priority: topic.priority,
    estimated_classes: topic.estimatedClasses,
    target_date: topic.targetDate ? formatISODate(topic.targetDate) : null,
    started_at: topic.startedAt ? formatISODate(topic.startedAt) : null,
    completed_at: topic.completedAt ? formatISODate(topic.completedAt) : null,
    revised_at: topic.revisedAt ? formatISODate(topic.revisedAt) : null,
    remarks: topic.remarks,
    needs_manual_review: topic.needsManualReview,
    display_order: topic.displayOrder,
    subtopics: mapSubtopicsFromDb(topic.subtopics),
  };
}

function countTopicSubtopics(subtopics: unknown): number {
  return countSubtopics(
    mapSubtopicsFromDb(subtopics).map((st) => ({
      nestedSubtopics: st.nested_subtopics,
    })),
  );
}

export async function getSyllabusSubjectsForClass(
  classId: string,
): Promise<SyllabusSubjectSummary[]> {
  const subjects = await prisma.syllabusSubject.findMany({
    where: { classId },
    include: {
      chapters: {
        include: { topics: true },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return subjects.map((subject) => {
    const allTopics = subject.chapters.flatMap((ch) => ch.topics);
    const summary = getSyllabusSummary(allTopics);

    return {
      id: subject.id,
      subject_name: subject.subjectName,
      stream: subject.stream,
      textbook_name: subject.textbookName,
      board: subject.board,
      academic_year: subject.academicYear,
      chapters_count: subject.chapters.length,
      topics_count: summary.total,
      completed_topics_count: summary.completed + summary.revised,
      progress_percentage: summary.progressPercentage,
    };
  });
}

export async function getSyllabusSubjectDetail(
  subjectId: string,
): Promise<SyllabusSubjectDetail | null> {
  const subject = await prisma.syllabusSubject.findUnique({
    where: { id: subjectId },
    include: {
      chapters: {
        include: {
          topics: { orderBy: { displayOrder: "asc" } },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!subject) return null;

  const allTopics = subject.chapters.flatMap((ch) => ch.topics);
  const summary = getSyllabusSummary(allTopics);
  const subtopicsCount = allTopics.reduce(
    (sum, topic) => sum + countTopicSubtopics(topic.subtopics),
    0,
  );

  return {
    id: subject.id,
    class_id: subject.classId,
    subject_name: subject.subjectName,
    stream: subject.stream,
    textbook_name: subject.textbookName,
    board: subject.board,
    academic_year: subject.academicYear,
    summary: {
      chapters_count: subject.chapters.length,
      topics_count: summary.total,
      subtopics_count: subtopicsCount,
      not_started_count: summary.notStarted,
      in_progress_count: summary.inProgress,
      completed_count: summary.completed,
      revised_count: summary.revised,
      skipped_count: summary.skipped,
      progress_percentage: summary.progressPercentage,
      total: summary.total,
      not_started: summary.notStarted,
      in_progress: summary.inProgress,
      completed: summary.completed,
      revised: summary.revised,
      skipped: summary.skipped,
    },
    chapters: subject.chapters.map((chapter) => {
      const chapterSummary = getSyllabusSummary(chapter.topics);
      const chapterSubtopics = chapter.topics.reduce(
        (sum, topic) => sum + countTopicSubtopics(topic.subtopics),
        0,
      );

      return {
        id: chapter.id,
        chapter_number: chapter.chapterNumber,
        chapter_title: chapter.chapterTitle,
        chapter_summary: chapter.chapterSummary,
        display_order: chapter.displayOrder,
        progress_percentage: chapterSummary.progressPercentage,
        topics_count: chapter.topics.length,
        subtopics_count: chapterSubtopics,
        status_summary: mapSummaryToJson(chapterSummary),
        topics: chapter.topics.map(mapTopicToJson),
      };
    }),
  };
}

export async function getSyllabusChapterDetail(
  chapterId: string,
): Promise<SyllabusChapterDetail | null> {
  const chapter = await prisma.syllabusChapter.findUnique({
    where: { id: chapterId },
    include: {
      syllabusSubject: true,
      topics: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!chapter) return null;

  const summary = getSyllabusSummary(chapter.topics);

  return {
    id: chapter.id,
    class_id: chapter.syllabusSubject.classId,
    subject_id: chapter.syllabusSubjectId,
    subject_name: chapter.syllabusSubject.subjectName,
    chapter_number: chapter.chapterNumber,
    chapter_title: chapter.chapterTitle,
    chapter_summary: chapter.chapterSummary,
    display_order: chapter.displayOrder,
    metadata: chapter.metadata,
    progress: mapSummaryToJson(summary),
    topics: chapter.topics.map(mapTopicToJson),
  };
}

export async function findExistingSubjectByName(
  classId: string,
  subjectName: string,
): Promise<SyllabusExistingSubject | null> {
  const subject = await prisma.syllabusSubject.findFirst({
    where: {
      classId,
      subjectName: { equals: subjectName, mode: "insensitive" },
    },
    select: { id: true, subjectName: true },
  });

  if (!subject) return null;

  return {
    id: subject.id,
    subject_name: subject.subjectName,
  };
}

export function serializeSubtopicsForDb(
  subtopics: { subtopic_title: string; nested_subtopics?: string[] }[],
) {
  return subtopics.map((st) => ({
    subtopicTitle: st.subtopic_title,
    nestedSubtopics: st.nested_subtopics ?? [],
  }));
}

export async function getSyllabusOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: SyllabusClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const subjects = await getSyllabusSubjectsForClass(cls.id);
      const topicsCount = subjects.reduce((sum, s) => sum + s.topics_count, 0);
      const progressPercentage =
        subjects.length === 0
          ? 0
          : Math.round(
              subjects.reduce((sum, s) => sum + s.progress_percentage, 0) /
                subjects.length,
            );

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        subjects_count: subjects.length,
        topics_count: topicsCount,
        progress_percentage: progressPercentage,
        subjects,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
