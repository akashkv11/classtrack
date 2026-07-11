import { prisma } from "@/lib/db";
import { summarizeRecords } from "@/lib/attendance";
import { computeAssessmentSummary } from "@/lib/assessments/summary";
import { getLowMarksThresholdPercent } from "@/lib/settings";
import { parseISODate, todayISO } from "@/lib/dates";
import { getAttendanceAlertsForClass } from "@/lib/queries/attendance-alerts";
import { getActiveClasses } from "@/lib/queries/classes";
import { getTodaySchedule } from "@/lib/queries/timetable";
import { getSyllabusSummary } from "@/lib/syllabus/progress";
import { normalizeSubjectName } from "@/lib/timetable/links";
import type {
  DashboardClassCard,
  DashboardData,
  DashboardFollowUpSummary,
  DashboardTodayCompliance,
  DashboardTodayItem,
} from "@/lib/types/dashboard";

function currentMonthFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function formatSuggestedTopic(options: {
  chapterNumber: number | null;
  chapterTitle: string;
  topicTitle: string;
}): string {
  const chapterLabel = options.chapterNumber
    ? `Chapter ${options.chapterNumber}: ${options.chapterTitle}`
    : options.chapterTitle;
  return `${chapterLabel} · ${options.topicTitle}`;
}

async function getSuggestedTopicsByClass(
  classIds: string[],
): Promise<Map<string, string>> {
  if (classIds.length === 0) return new Map();

  const subjects = await prisma.syllabusSubject.findMany({
    where: { classId: { in: classIds } },
    include: {
      chapters: {
        orderBy: { displayOrder: "asc" },
        include: {
          topics: { orderBy: { displayOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = new Map<string, string>();

  for (const subject of subjects) {
    if (result.has(subject.classId)) continue;

    let fallback: string | null = null;

    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        const formatted = formatSuggestedTopic({
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle,
          topicTitle: topic.topicTitle,
        });

        if (topic.status === "IN_PROGRESS") {
          result.set(subject.classId, formatted);
          break;
        }

        if (!fallback && topic.status === "NOT_STARTED") {
          fallback = formatted;
        }
      }
      if (result.has(subject.classId)) break;
    }

    if (!result.has(subject.classId) && fallback) {
      result.set(subject.classId, fallback);
    }
  }

  return result;
}

async function getSyllabusMetricsByClass(classIds: string[]) {
  const subjects = await prisma.syllabusSubject.findMany({
    where: { classId: { in: classIds } },
    include: {
      chapters: {
        include: { topics: true },
      },
    },
  });

  const progress = new Map<string, number | null>();
  const importantPending = new Map<string, number>();

  for (const classId of classIds) {
    progress.set(classId, null);
    importantPending.set(classId, 0);
  }

  const topicsByClass = new Map<string, { status: string; priority: string }[]>();

  for (const subject of subjects) {
    const topics = subject.chapters.flatMap((chapter) => chapter.topics);
    const existing = topicsByClass.get(subject.classId) ?? [];
    topicsByClass.set(subject.classId, [
      ...existing,
      ...topics.map((topic) => ({
        status: topic.status,
        priority: topic.priority,
      })),
    ]);
  }

  for (const classId of classIds) {
    const topics = topicsByClass.get(classId) ?? [];
    if (topics.length === 0) continue;

    const summary = getSyllabusSummary(topics);
    progress.set(classId, summary.progressPercentage);

    const pendingImportant = topics.filter(
      (topic) =>
        (topic.priority === "IMPORTANT" || topic.priority === "EXAM_IMPORTANT") &&
        (topic.status === "NOT_STARTED" || topic.status === "IN_PROGRESS"),
    ).length;
    importantPending.set(classId, pendingImportant);
  }

  return { progress, importantPending };
}

async function getTodaySessionsByClass(classIds: string[], today: string) {
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId: { in: classIds },
      attendanceDate: parseISODate(today),
    },
    include: {
      records: { select: { status: true } },
    },
  });

  return new Map(
    sessions.map((session) => [
      session.classId,
      {
        id: session.id,
        summary: summarizeRecords(session.records),
      },
    ]),
  );
}

async function getDiaryContextByClass(classIds: string[], today: string) {
  const [todayEntries, latestEntries] = await Promise.all([
    prisma.teachingDiaryEntry.findMany({
      where: {
        classId: { in: classIds },
        entryDate: parseISODate(today),
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        classId: true,
        timetableEntryId: true,
        topicTaught: true,
        nextClassPlan: true,
        syllabusSubject: { select: { subjectName: true } },
      },
    }),
    Promise.all(
      classIds.map(async (classId) => {
        const entry = await prisma.teachingDiaryEntry.findFirst({
          where: { classId },
          orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
          select: {
            topicTaught: true,
            nextClassPlan: true,
          },
        });
        return [classId, entry] as const;
      }),
    ),
  ]);

  const todayByClass = new Map<string, (typeof todayEntries)[number]>();
  const todayByTimetableEntry = new Map<string, (typeof todayEntries)[number]>();
  const todayByClassSubject = new Map<string, (typeof todayEntries)[number]>();

  for (const entry of todayEntries) {
    if (!todayByClass.has(entry.classId)) {
      todayByClass.set(entry.classId, entry);
    }
    if (entry.timetableEntryId && !todayByTimetableEntry.has(entry.timetableEntryId)) {
      todayByTimetableEntry.set(entry.timetableEntryId, entry);
    }
    if (entry.syllabusSubject) {
      const subjectKey = `${entry.classId}:${normalizeSubjectName(entry.syllabusSubject.subjectName)}`;
      if (!todayByClassSubject.has(subjectKey)) {
        todayByClassSubject.set(subjectKey, entry);
      }
    }
  }

  return {
    todayByClass,
    todayByTimetableEntry,
    todayByClassSubject,
    latestByClass: new Map(latestEntries),
  };
}

function resolveDiaryForScheduleItem(
  item: { entry_id: string; class_id: string; subject: string },
  diaryContext: Awaited<ReturnType<typeof getDiaryContextByClass>>,
) {
  const linked = diaryContext.todayByTimetableEntry.get(item.entry_id);
  if (linked) return linked;

  const subjectKey = `${item.class_id}:${normalizeSubjectName(item.subject)}`;
  const bySubject = diaryContext.todayByClassSubject.get(subjectKey);
  if (bySubject) return bySubject;

  return null;
}

async function getOpenAlertMetricsByClass(classIds: string[], month: string) {
  const entries = await Promise.all(
    classIds.map(async (classId) => {
      const data = await getAttendanceAlertsForClass(classId, month, {
        status: "ALL",
      });
      const openAlerts =
        data?.alerts.filter(
          (alert) => alert.status === "OPEN" || alert.status === "IN_PROGRESS",
        ) ?? [];
      const preview = openAlerts[0]
        ? `${openAlerts[0].full_name}: ${openAlerts[0].title}`
        : null;
      return [classId, { count: openAlerts.length, preview }] as const;
    }),
  );

  return new Map(entries);
}

async function getFollowUpCounts(classIds: string[], today: string) {
  const todayDate = parseISODate(today);

  const [
    openStudentNotes,
    overdueStudentNotes,
    openParentFollowUps,
    overdueParentFollowUps,
  ] = await Promise.all([
    prisma.studentNote.count({
      where: { classId: { in: classIds }, status: "OPEN" },
    }),
    prisma.studentNote.count({
      where: {
        classId: { in: classIds },
        status: "OPEN",
        followUpNeeded: true,
        followUpDate: { lt: todayDate },
      },
    }),
    prisma.parentCommunication.count({
      where: {
        classId: { in: classIds },
        status: { in: ["OPEN", "FOLLOW_UP_NEEDED"] },
        followUpNeeded: true,
      },
    }),
    prisma.parentCommunication.count({
      where: {
        classId: { in: classIds },
        status: { in: ["OPEN", "FOLLOW_UP_NEEDED"] },
        followUpNeeded: true,
        followUpDate: { lt: todayDate },
      },
    }),
  ]);

  return {
    openStudentNotes,
    overdueStudentNotes,
    openParentFollowUps,
    overdueParentFollowUps,
  };
}

async function getPerClassFollowUpCounts(classIds: string[], today: string) {
  const todayDate = parseISODate(today);

  const [notes, communications] = await Promise.all([
    prisma.studentNote.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds }, status: "OPEN" },
      _count: { _all: true },
    }),
    prisma.parentCommunication.groupBy({
      by: ["classId"],
      where: {
        classId: { in: classIds },
        status: { in: ["OPEN", "FOLLOW_UP_NEEDED"] },
        followUpNeeded: true,
      },
      _count: { _all: true },
    }),
  ]);

  const openNotes = new Map(notes.map((row) => [row.classId, row._count._all]));
  const openParent = new Map(
    communications.map((row) => [row.classId, row._count._all]),
  );

  for (const classId of classIds) {
    if (!openNotes.has(classId)) openNotes.set(classId, 0);
    if (!openParent.has(classId)) openParent.set(classId, 0);
  }

  return { openNotes, openParent, todayDate };
}

async function getLatestAssessmentByClass(classIds: string[]) {
  const results = await Promise.all(
    classIds.map(async (classId) => {
      const assessment = await prisma.assessment.findFirst({
        where: { classId },
        orderBy: [{ assessmentDate: "desc" }, { createdAt: "desc" }],
        include: {
          marks: { select: { marksObtained: true } },
        },
      });

      if (!assessment) return [classId, null] as const;

      const studentCount = await prisma.student.count({
        where: { classId, isActive: true },
      });

      const lowMarksThreshold = await getLowMarksThresholdPercent();
      const summary = computeAssessmentSummary(
        assessment.marks,
        assessment.maxMarks,
        studentCount,
        lowMarksThreshold,
      );

      return [
        classId,
        {
          name: assessment.name,
          average: summary.class_average,
          maxMarks: assessment.maxMarks,
          below40Count: summary.below_40_percent_count,
        },
      ] as const;
    }),
  );

  return new Map(results);
}

async function getDashboardTodayItems(today: string): Promise<DashboardTodayItem[]> {
  const month = currentMonthFromDate(today);
  const schedule = await getTodaySchedule(today);

  if (schedule.length === 0) return [];

  const scheduledClassIds = [...new Set(schedule.map((item) => item.class_id))];

  const [sessions, diaryContext, suggestedTopics, alertMetrics] = await Promise.all([
    getTodaySessionsByClass(scheduledClassIds, today),
    getDiaryContextByClass(scheduledClassIds, today),
    getSuggestedTopicsByClass(scheduledClassIds),
    getOpenAlertMetricsByClass(scheduledClassIds, month),
  ]);

  return schedule.map((item) => {
    const session = sessions.get(item.class_id);
    const todayDiary = resolveDiaryForScheduleItem(item, diaryContext);
    const latestDiary = diaryContext.latestByClass.get(item.class_id);
    const alerts = alertMetrics.get(item.class_id);

    const diaryWritten = Boolean(todayDiary);
    const diaryEntry = todayDiary ?? latestDiary;

    return {
      ...item,
      attendance_present: session?.summary.present ?? null,
      attendance_absent: session?.summary.absent ?? null,
      attendance_late: session?.summary.late ?? null,
      teaching_diary_status: diaryWritten ? "written" : "pending",
      teaching_diary_entry_id: todayDiary?.id ?? null,
      last_topic_taught: diaryEntry?.topicTaught ?? null,
      next_class_plan: diaryEntry?.nextClassPlan ?? null,
      suggested_next_topic: suggestedTopics.get(item.class_id) ?? null,
      open_alerts_count: alerts?.count ?? 0,
      top_alert_preview: alerts?.preview ?? null,
    };
  });
}

function buildTodayCompliance(items: DashboardTodayItem[]): DashboardTodayCompliance {
  return {
    scheduled_classes: items.length,
    attendance_pending: items.filter((item) => item.attendance_status === "not_marked")
      .length,
    diary_pending: items.filter((item) => item.teaching_diary_status === "pending").length,
  };
}

export async function getTodayScheduleItems(today?: string): Promise<DashboardTodayItem[]> {
  const isoDate = today ?? todayISO();
  const { activeYear } = await getActiveClasses();
  if (!activeYear) return [];
  return getDashboardTodayItems(isoDate);
}

async function getDashboardClassCards(
  classes: Awaited<ReturnType<typeof getActiveClasses>>["classes"],
  today: string,
): Promise<DashboardClassCard[]> {
  const classIds = classes.map((cls) => cls.id);
  const month = currentMonthFromDate(today);

  const [
    sessions,
    diaryContext,
    syllabusMetrics,
    alertMetrics,
    followUpCounts,
    latestAssessments,
  ] = await Promise.all([
    getTodaySessionsByClass(classIds, today),
    getDiaryContextByClass(classIds, today),
    getSyllabusMetricsByClass(classIds),
    getOpenAlertMetricsByClass(classIds, month),
    getPerClassFollowUpCounts(classIds, today),
    getLatestAssessmentByClass(classIds),
  ]);

  return classes.map((cls) => {
    const session = sessions.get(cls.id);
    const todayDiary = diaryContext.todayByClass.get(cls.id);
    const latestDiary = diaryContext.latestByClass.get(cls.id);
    const diaryEntry = todayDiary ?? latestDiary;
    const assessment = latestAssessments.get(cls.id);

    return {
      class_id: cls.id,
      display_name: cls.displayName,
      student_count: cls._count.students,
      attendance_marked_today: Boolean(session),
      attendance_session_id: session?.id ?? null,
      attendance_present: session?.summary.present ?? null,
      attendance_absent: session?.summary.absent ?? null,
      diary_added_today: Boolean(todayDiary),
      last_topic_taught: diaryEntry?.topicTaught ?? null,
      next_class_plan: diaryEntry?.nextClassPlan ?? null,
      syllabus_progress_percentage: syllabusMetrics.progress.get(cls.id) ?? null,
      important_topics_pending: syllabusMetrics.importantPending.get(cls.id) ?? 0,
      open_attendance_alerts: alertMetrics.get(cls.id)?.count ?? 0,
      open_student_notes: followUpCounts.openNotes.get(cls.id) ?? 0,
      open_parent_follow_ups: followUpCounts.openParent.get(cls.id) ?? 0,
      latest_assessment_name: assessment?.name ?? null,
      latest_assessment_average: assessment?.average ?? null,
      latest_assessment_max_marks: assessment?.maxMarks ?? null,
      latest_assessment_below_40_count: assessment?.below40Count ?? null,
    };
  });
}

async function getDashboardFollowUpSummary(
  classIds: string[],
  today: string,
  month: string,
): Promise<DashboardFollowUpSummary> {
  const [followUps, alertTotals] = await Promise.all([
    getFollowUpCounts(classIds, today),
    Promise.all(
      classIds.map((classId) =>
        getAttendanceAlertsForClass(classId, month, { status: "ALL" }),
      ),
    ),
  ]);

  const openAttendanceAlerts = alertTotals.reduce((sum, data) => {
    const open =
      data?.alerts.filter(
        (alert) => alert.status === "OPEN" || alert.status === "IN_PROGRESS",
      ).length ?? 0;
    return sum + open;
  }, 0);

  return {
    open_student_notes: followUps.openStudentNotes,
    overdue_student_notes: followUps.overdueStudentNotes,
    open_parent_follow_ups: followUps.openParentFollowUps,
    overdue_parent_follow_ups: followUps.overdueParentFollowUps,
    open_attendance_alerts: openAttendanceAlerts,
  };
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const { activeYear, classes } = await getActiveClasses();
  if (!activeYear) return null;

  const today = todayISO();
  const classIds = classes.map((cls) => cls.id);
  const month = currentMonthFromDate(today);

  const [todayItems, classCards, followUps, lowMarksThreshold] = await Promise.all([
    getDashboardTodayItems(today),
    getDashboardClassCards(classes, today),
    getDashboardFollowUpSummary(classIds, today, month),
    getLowMarksThresholdPercent(),
  ]);

  return {
    today,
    active_year_name: activeYear.name,
    low_marks_threshold_percent: lowMarksThreshold,
    today_items: todayItems,
    today_compliance: buildTodayCompliance(todayItems),
    classes: classCards,
    follow_ups: followUps,
  };
}
