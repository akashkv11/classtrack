import { prisma } from "@/lib/db";
import { formatISODate, parseISODate } from "@/lib/dates";
import type {
  DiaryStatus,
  StudentResponse,
  SyllabusStatusUpdate,
  TeachingDiaryClassOverview,
  TeachingDiaryEntrySummary,
  TeachingDiarySummary,
} from "@/lib/types/teaching-diary";
import { getActiveClasses } from "@/lib/queries/classes";
import { applyStatusDates } from "@/lib/syllabus/status-dates";
import type { TopicStatus } from "@/lib/syllabus/progress";

type DbEntry = {
  id: string;
  entryDate: Date;
  timetableEntryId: string | null;
  topicTaught: string;
  teachingNotes: string | null;
  examplesCovered: string | null;
  studentResponse: string | null;
  nextClassPlan: string | null;
  diaryStatus: string;
  syllabusStatusUpdate: string | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  syllabusSubject: {
    id: string;
    subjectName: string;
  } | null;
  syllabusChapter: {
    id: string;
    chapterNumber: number | null;
    chapterTitle: string;
  } | null;
  syllabusTopic: {
    id: string;
    topicTitle: string;
    status: string;
  } | null;
};

const entryInclude = {
  syllabusSubject: {
    select: { id: true, subjectName: true },
  },
  syllabusChapter: {
    select: { id: true, chapterNumber: true, chapterTitle: true },
  },
  syllabusTopic: {
    select: { id: true, topicTitle: true, status: true },
  },
} as const;

export function mapEntryToJson(entry: DbEntry): TeachingDiaryEntrySummary {
  return {
    id: entry.id,
    entry_date: formatISODate(entry.entryDate),
    timetable_entry_id: entry.timetableEntryId,
    subject: entry.syllabusSubject
      ? { id: entry.syllabusSubject.id, name: entry.syllabusSubject.subjectName }
      : null,
    chapter: entry.syllabusChapter
      ? {
          id: entry.syllabusChapter.id,
          chapter_number: entry.syllabusChapter.chapterNumber,
          chapter_title: entry.syllabusChapter.chapterTitle,
        }
      : null,
    topic: entry.syllabusTopic
      ? {
          id: entry.syllabusTopic.id,
          topic_title: entry.syllabusTopic.topicTitle,
          status: entry.syllabusTopic.status,
        }
      : null,
    topic_taught: entry.topicTaught,
    teaching_notes: entry.teachingNotes,
    examples_covered: entry.examplesCovered,
    student_response: (entry.studentResponse as StudentResponse) ?? null,
    next_class_plan: entry.nextClassPlan,
    diary_status: entry.diaryStatus as DiaryStatus,
    syllabus_status_update: entry.syllabusStatusUpdate as SyllabusStatusUpdate | null,
    remarks: entry.remarks,
    created_at: entry.createdAt.toISOString(),
    updated_at: entry.updatedAt.toISOString(),
  };
}

export function computeDiarySummary(
  entries: TeachingDiaryEntrySummary[],
): TeachingDiarySummary {
  return {
    total_entries: entries.length,
    topics_completed: entries.filter((e) => e.diary_status === "TAUGHT").length,
    topics_in_progress: entries.filter((e) => e.diary_status === "PARTIALLY_TAUGHT")
      .length,
    revision_entries: entries.filter((e) => e.diary_status === "REVISION").length,
  };
}

export type DiaryListFilters = {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: DiaryStatus;
};

export async function getTeachingDiaryEntriesForClass(
  classId: string,
  filters: DiaryListFilters = {},
): Promise<TeachingDiaryEntrySummary[]> {
  const where: {
    classId: string;
    syllabusSubjectId?: string;
    syllabusChapterId?: string;
    syllabusTopicId?: string;
    diaryStatus?: string;
    entryDate?: { gte?: Date; lte?: Date };
  } = { classId };

  if (filters.subjectId) where.syllabusSubjectId = filters.subjectId;
  if (filters.chapterId) where.syllabusChapterId = filters.chapterId;
  if (filters.topicId) where.syllabusTopicId = filters.topicId;
  if (filters.status) where.diaryStatus = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    where.entryDate = {};
    if (filters.dateFrom) where.entryDate.gte = parseISODate(filters.dateFrom);
    if (filters.dateTo) where.entryDate.lte = parseISODate(filters.dateTo);
  }

  const entries = await prisma.teachingDiaryEntry.findMany({
    where,
    include: entryInclude,
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
  });

  return entries.map(mapEntryToJson);
}

export async function getTeachingDiaryEntryById(
  entryId: string,
): Promise<TeachingDiaryEntrySummary | null> {
  const entry = await prisma.teachingDiaryEntry.findUnique({
    where: { id: entryId },
    include: entryInclude,
  });

  return entry ? mapEntryToJson(entry) : null;
}

export async function applySyllabusStatusUpdate(
  topicId: string,
  statusUpdate: SyllabusStatusUpdate,
): Promise<void> {
  if (statusUpdate === "KEEP_CURRENT") return;

  const existing = await prisma.syllabusTopic.findUnique({
    where: { id: topicId },
  });

  if (!existing) return;

  const dateUpdates = applyStatusDates(statusUpdate as TopicStatus, existing);

  await prisma.syllabusTopic.update({
    where: { id: topicId },
    data: {
      status: statusUpdate,
      ...dateUpdates,
    },
  });
}

export async function getTeachingDiaryOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: TeachingDiaryClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const [count, latest] = await Promise.all([
        prisma.teachingDiaryEntry.count({ where: { classId: cls.id } }),
        prisma.teachingDiaryEntry.findFirst({
          where: { classId: cls.id },
          orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
          select: { entryDate: true },
        }),
      ]);

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        entries_count: count,
        latest_entry_date: latest ? formatISODate(latest.entryDate) : null,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
