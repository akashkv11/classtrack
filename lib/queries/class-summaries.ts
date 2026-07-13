import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSyllabusSummary } from "@/lib/syllabus/progress";

function progressPercentageFromStatusCounts(
  rows: { status: string; _count: { _all: number } }[],
): number | null {
  if (rows.length === 0) return null;

  const topics = rows.flatMap((row) =>
    Array.from({ length: row._count._all }, () => ({ status: row.status })),
  );

  return getSyllabusSummary(topics).progressPercentage;
}

export const getSyllabusProgressPercentageForClass = cache(
  async (classId: string): Promise<number | null> => {
    const rows = await prisma.syllabusTopic.groupBy({
      by: ["status"],
      where: {
        syllabusChapter: {
          syllabusSubject: { classId },
        },
      },
      _count: { _all: true },
    });

    return progressPercentageFromStatusCounts(rows);
  },
);

export async function getSyllabusMetricsByClassIds(classIds: string[]) {
  const progress = new Map<string, number | null>();
  const importantPending = new Map<string, number>();

  for (const classId of classIds) {
    progress.set(classId, null);
    importantPending.set(classId, 0);
  }

  if (classIds.length === 0) {
    return { progress, importantPending };
  }

  const rows = await prisma.syllabusTopic.findMany({
    where: {
      syllabusChapter: {
        syllabusSubject: { classId: { in: classIds } },
      },
    },
    select: {
      status: true,
      priority: true,
      syllabusChapter: {
        select: {
          syllabusSubject: { select: { classId: true } },
        },
      },
    },
  });

  const topicsByClass = new Map<string, { status: string; priority: string }[]>();
  for (const row of rows) {
    const classId = row.syllabusChapter.syllabusSubject.classId;
    const existing = topicsByClass.get(classId) ?? [];
    existing.push({ status: row.status, priority: row.priority });
    topicsByClass.set(classId, existing);
  }

  for (const classId of classIds) {
    const topics = topicsByClass.get(classId) ?? [];
    if (topics.length === 0) continue;

    progress.set(classId, getSyllabusSummary(topics).progressPercentage);
    importantPending.set(
      classId,
      topics.filter(
        (topic) =>
          (topic.priority === "IMPORTANT" || topic.priority === "EXAM_IMPORTANT") &&
          (topic.status === "NOT_STARTED" || topic.status === "IN_PROGRESS"),
      ).length,
    );
  }

  return { progress, importantPending };
}

export const getImportantPendingTopicCountForClass = cache(async (classId: string) => {
  return prisma.syllabusTopic.count({
    where: {
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      priority: { in: ["IMPORTANT", "EXAM_IMPORTANT"] },
      syllabusChapter: {
        syllabusSubject: { classId },
      },
    },
  });
});

export const getOpenAttendanceAlertCountForClass = cache(
  async (classId: string, month: string) => {
    return prisma.attendanceAlertStatus.count({
      where: {
        classId,
        month,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    });
  },
);

export async function getOpenAttendanceAlertCountsByClass(
  classIds: string[],
  month: string,
) {
  const counts = new Map<string, number>();
  for (const classId of classIds) {
    counts.set(classId, 0);
  }

  if (classIds.length === 0) return counts;

  const rows = await prisma.attendanceAlertStatus.groupBy({
    by: ["classId"],
    where: {
      classId: { in: classIds },
      month,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    _count: { _all: true },
  });

  for (const row of rows) {
    counts.set(row.classId, row._count._all);
  }

  return counts;
}

export async function getTotalOpenAttendanceAlertCount(classIds: string[], month: string) {
  if (classIds.length === 0) return 0;

  return prisma.attendanceAlertStatus.count({
    where: {
      classId: { in: classIds },
      month,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });
}

export async function getStoredAttendanceAlertCountsForClass(
  classId: string,
  month: string,
) {
  const [openAlertsCount, totalAlertsCount] = await Promise.all([
    prisma.attendanceAlertStatus.count({
      where: {
        classId,
        month,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.attendanceAlertStatus.count({
      where: { classId, month },
    }),
  ]);

  return { openAlertsCount, totalAlertsCount };
}
