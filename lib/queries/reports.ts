import { prisma } from "@/lib/db";
import {
  calculateAttendancePercentage,
  type AttendanceStatus,
} from "@/lib/attendance";
import { endOfMonth, formatISODate, startOfMonth } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import { getSyllabusSubjectsForClass } from "@/lib/queries/syllabus";
import {
  computeDiarySummary,
  getTeachingDiaryEntriesForClass,
  mapEntryToJson,
} from "@/lib/queries/teaching-diary";
import { lateCountsAsPresent } from "@/lib/settings";
import { getSyllabusSummary } from "@/lib/syllabus/progress";
import { DIARY_STATUS_LABELS } from "@/lib/teaching-diary/status";
import type {
  MonthlyAcademicWorkReport,
  MonthlyReport,
  PendingContinuationItem,
  ReportsClassOverview,
  SyllabusProgressChapterRow,
  SyllabusProgressReport,
  TeachingDiaryReport,
  TeachingDiaryReportEntry,
} from "@/lib/types/report";
import type { DiaryStatus } from "@/lib/types/teaching-diary";

function mapDiaryEntryToReportEntry(
  entry: ReturnType<typeof mapEntryToJson>,
): TeachingDiaryReportEntry {
  const chapter = entry.chapter
    ? entry.chapter.chapter_number
      ? `Chapter ${entry.chapter.chapter_number}: ${entry.chapter.chapter_title}`
      : entry.chapter.chapter_title
    : null;

  return {
    entry_date: entry.entry_date,
    subject: entry.subject?.name ?? null,
    chapter,
    topic: entry.topic?.topic_title ?? null,
    topic_taught: entry.topic_taught,
    teaching_notes: entry.teaching_notes,
    next_class_plan: entry.next_class_plan,
    diary_status: DIARY_STATUS_LABELS[entry.diary_status as DiaryStatus] ?? entry.diary_status,
  };
}

function monthToDateRange(month: string): { dateFrom: string; dateTo: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  const start = startOfMonth(year, monthNum);
  const end = endOfMonth(year, monthNum);
  return {
    dateFrom: formatISODate(start),
    dateTo: formatISODate(end),
  };
}

export async function getMonthlyAttendanceReport(
  classId: string,
  monthParam: string,
): Promise<MonthlyReport | null> {
  const [yearStr, monthStr] = monthParam.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return null;

  const rangeStart = startOfMonth(year, month);
  const rangeEnd = endOfMonth(year, month);

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId,
      attendanceDate: { gte: rangeStart, lte: rangeEnd },
    },
    include: {
      records: {
        include: { student: true },
      },
    },
    orderBy: { attendanceDate: "asc" },
  });

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: { rollNo: "asc" },
  });

  const lateAsPresent = await lateCountsAsPresent();
  const workingDays = sessions.length;

  const reportStudents = students.map((student) => {
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    for (const session of sessions) {
      const record = session.records.find((r) => r.studentId === student.id);
      if (!record) continue;
      const status = record.status as AttendanceStatus;
      if (status === "present") presentDays += 1;
      if (status === "absent") absentDays += 1;
      if (status === "late") lateDays += 1;
    }

    return {
      roll_no: student.rollNo,
      full_name: student.fullName,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      attendance_percentage: calculateAttendancePercentage({
        presentDays,
        lateDays,
        workingDays,
        lateCountsAsPresent: lateAsPresent,
      }),
    };
  });

  return {
    class: { id: cls.id, display_name: cls.displayName },
    month: monthParam,
    working_days: workingDays,
    students: reportStudents,
  };
}

export async function getSyllabusProgressReport(
  classId: string,
  subjectId?: string,
): Promise<SyllabusProgressReport | null> {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return null;

  const subjects = await prisma.syllabusSubject.findMany({
    where: {
      classId,
      ...(subjectId ? { id: subjectId } : {}),
    },
    include: {
      chapters: {
        include: { topics: true },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (subjects.length === 0) {
    return {
      class: { id: cls.id, display_name: cls.displayName },
      subject: null,
      summary: {
        total_topics: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        revised: 0,
        progress_percentage: 0,
      },
      chapters: [],
    };
  }

  const allChapters = subjects.flatMap((s) => s.chapters);
  const allTopics = allChapters.flatMap((ch) => ch.topics);
  const summary = getSyllabusSummary(allTopics);

  const chapters: SyllabusProgressChapterRow[] = allChapters.map((chapter) => {
    const chSummary = getSyllabusSummary(chapter.topics);
    return {
      chapter_number: chapter.chapterNumber,
      chapter_title: chapter.chapterTitle,
      topics_total: chSummary.total,
      topics_completed: chSummary.completed,
      topics_in_progress: chSummary.inProgress,
      topics_pending: chSummary.notStarted + chSummary.skipped,
      topics_revised: chSummary.revised,
      progress_percentage: chSummary.progressPercentage,
    };
  });

  const subjectRef =
    subjectId && subjects[0]
      ? { id: subjects[0].id, name: subjects[0].subjectName }
      : subjects.length === 1
        ? { id: subjects[0].id, name: subjects[0].subjectName }
        : null;

  return {
    class: { id: cls.id, display_name: cls.displayName },
    subject: subjectRef,
    summary: {
      total_topics: summary.total,
      completed: summary.completed,
      in_progress: summary.inProgress,
      pending: summary.notStarted + summary.skipped,
      revised: summary.revised,
      progress_percentage: summary.progressPercentage,
    },
    chapters,
  };
}

export async function getTeachingDiaryReport(
  classId: string,
  options: { month?: string; subjectId?: string } = {},
): Promise<TeachingDiaryReport | null> {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return null;

  const dateRange = options.month ? monthToDateRange(options.month) : null;

  const entries = await getTeachingDiaryEntriesForClass(classId, {
    subjectId: options.subjectId,
    ...(dateRange
      ? { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo }
      : {}),
  });

  const reportEntries = entries.map(mapDiaryEntryToReportEntry);
  const summary = computeDiarySummary(entries);

  let subject: { id: string; name: string } | null = null;
  if (options.subjectId) {
    const subj = await prisma.syllabusSubject.findUnique({
      where: { id: options.subjectId },
      select: { id: true, subjectName: true },
    });
    if (subj) subject = { id: subj.id, name: subj.subjectName };
  }

  return {
    class: { id: cls.id, display_name: cls.displayName },
    month: options.month ?? null,
    subject,
    entries: reportEntries,
    summary: {
      total_entries: summary.total_entries,
      topics_taught: summary.topics_completed,
      partial_topics: summary.topics_in_progress,
      revision_entries: summary.revision_entries,
    },
  };
}

export async function getMonthlyAcademicWorkReport(
  classId: string,
  month: string,
  subjectId?: string,
): Promise<MonthlyAcademicWorkReport | null> {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return null;

  const { dateFrom, dateTo } = monthToDateRange(month);

  const entries = await getTeachingDiaryEntriesForClass(classId, {
    subjectId,
    dateFrom,
    dateTo,
  });

  const activeEntries = entries.filter((e) => e.diary_status !== "CANCELLED");
  const reportEntries = activeEntries.map(mapDiaryEntryToReportEntry);

  const pendingContinuation: PendingContinuationItem[] = activeEntries
    .filter(
      (e) =>
        e.diary_status === "PARTIALLY_TAUGHT" ||
        (e.next_class_plan && e.next_class_plan.trim().length > 0),
    )
    .map((e) => ({
      entry_date: e.entry_date,
      topic_title: e.topic?.topic_title ?? null,
      topic_taught: e.topic_taught,
      next_class_plan: e.next_class_plan,
    }));

  let subject: { id: string; name: string } | null = null;
  if (subjectId) {
    const subj = await prisma.syllabusSubject.findUnique({
      where: { id: subjectId },
      select: { id: true, subjectName: true },
    });
    if (subj) subject = { id: subj.id, name: subj.subjectName };
  }

  return {
    class: { id: cls.id, display_name: cls.displayName },
    month,
    subject,
    topics_taught_this_month: activeEntries.length,
    topics_completed_this_month: activeEntries.filter((e) => e.diary_status === "TAUGHT")
      .length,
    revision_classes: activeEntries.filter((e) => e.diary_status === "REVISION").length,
    pending_continuation: pendingContinuation,
    diary_entries: reportEntries,
  };
}

export async function getReportsOverviewForActiveYear(): Promise<{
  activeYear: { id: string; name: string } | null;
  classes: ReportsClassOverview[];
}> {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return { activeYear: null, classes: [] };
  }

  const overviews = await Promise.all(
    classes.map(async (cls) => {
      const [subjects, diaryCount] = await Promise.all([
        getSyllabusSubjectsForClass(cls.id),
        prisma.teachingDiaryEntry.count({ where: { classId: cls.id } }),
      ]);

      const progressValues = subjects
        .map((s) => s.progress_percentage)
        .filter((p) => p > 0);
      const avgProgress =
        progressValues.length > 0
          ? Math.round(
              progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length,
            )
          : subjects.length > 0
            ? 0
            : null;

      return {
        class_id: cls.id,
        display_name: cls.displayName,
        syllabus_subjects_count: subjects.length,
        syllabus_progress_percentage: avgProgress,
        diary_entries_count: diaryCount,
      };
    }),
  );

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes: overviews,
  };
}
