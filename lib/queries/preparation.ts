import { prisma } from "@/lib/db";
import { parseISODate, formatISODate } from "@/lib/dates";
import { getAllSettings, SETTING_PREPARATION_THRESHOLD, SETTING_PREPARATION_INCLUDE_PARTIAL } from "@/lib/settings";
import { preparationStreak, type PreparationStudent, type PreparationStatus, type StudentPreparationHistoryEntry } from "@/lib/preparation";

export async function getPreparationRules() {
  const settings = await getAllSettings();
  const threshold = Number(settings[SETTING_PREPARATION_THRESHOLD]);
  return {
    threshold: Number.isInteger(threshold) && threshold > 0 ? threshold : 3,
    includePartial: settings[SETTING_PREPARATION_INCLUDE_PARTIAL] === "true",
  };
}

function newestFirst<T extends { preparationDate: Date; timetableEntry: { startTime: string } | null }>(a: T, b: T) {
  return b.preparationDate.getTime() - a.preparationDate.getTime() ||
    (b.timetableEntry?.startTime ?? "00:00").localeCompare(a.timetableEntry?.startTime ?? "00:00");
}

export async function getPreparationRoster(classId: string, date: string, timetableEntryId: string | null) {
  const preparationDate = parseISODate(date);
  const slot = { classId, preparationDate, timetableEntryId };
  const [students, history, timetable, rules] = await Promise.all([
    prisma.student.findMany({
      where: { classId, OR: [{ isActive: true }, { preparationRecords: { some: slot } }] },
      orderBy: { rollNo: "asc" },
    }),
    prisma.studentPreparation.findMany({
      where: { classId, preparationDate: { lte: preparationDate } },
      include: { timetableEntry: { select: { startTime: true } } },
    }),
    timetableEntryId ? prisma.timetableEntry.findUnique({ where: { id: timetableEntryId }, select: { startTime: true } }) : null,
    getPreparationRules(),
  ]);
  history.sort(newestFirst);
  const records: PreparationStudent[] = students.map((student) => {
    const studentHistory = history.filter((record) => record.studentId === student.id);
    const current = studentHistory.find((record) => record.preparationDate.getTime() === preparationDate.getTime() && record.timetableEntryId === timetableEntryId);
    const previous = studentHistory.filter((record) => record.preparationDate < preparationDate ||
      (record.preparationDate.getTime() === preparationDate.getTime() &&
        (record.timetableEntry?.startTime ?? "00:00") < (timetable?.startTime ?? "00:00")));
    return {
      student_id: student.id,
      roll_no: student.rollNo,
      full_name: student.fullName,
      preparation_status: (current?.status ?? "NOT_MARKED") as PreparationStatus,
      previous_streak: preparationStreak(previous.map((record) => record.status), rules.includePartial),
      note: current?.note ?? null,
      automatic_note: current?.automaticNote ?? null,
    };
  });
  return { records, ...rules };
}

export async function getStudentPreparationHistory(classId: string, studentId: string): Promise<StudentPreparationHistoryEntry[]> {
  const records = await prisma.studentPreparation.findMany({
    where: {
      classId, studentId,
      OR: [{ status: { in: ["NONE", "PARTIAL"] } }, { note: { not: null } }],
    },
    include: { timetableEntry: { select: { subject: true, startTime: true } } },
  });
  records.sort(newestFirst);
  return records.map((record) => ({
    id: record.id,
    date: formatISODate(record.preparationDate),
    timetable_entry_id: record.timetableEntryId,
    subject: record.timetableEntry?.subject ?? null,
    status: record.status as PreparationStatus,
    note: record.note,
    automatic_note: record.automaticNote,
  }));
}

export async function getPreparationAlerts(classIds: string[], today: string) {
  const [records, rules] = await Promise.all([
    prisma.studentPreparation.findMany({
      where: { classId: { in: classIds }, preparationDate: { lte: parseISODate(today) }, student: { isActive: true } },
      include: {
        student: { select: { fullName: true } },
        class: { select: { displayName: true } },
        timetableEntry: { select: { startTime: true, subject: true } },
      },
    }),
    getPreparationRules(),
  ]);
  records.sort(newestFirst);
  const groups = new Map<string, typeof records>();
  for (const record of records) {
    const key = `${record.classId}:${record.studentId}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups.values()].flatMap((history) => {
    const streak = preparationStreak(history.map((record) => record.status), rules.includePartial);
    if (streak < rules.threshold) return [];
    const latest = history[0];
    return [{
      studentId: latest.studentId,
      fullName: latest.student.fullName,
      classId: latest.classId,
      className: latest.class.displayName,
      date: formatISODate(latest.preparationDate),
      timetableEntryId: latest.timetableEntryId,
      subject: latest.timetableEntry?.subject ?? null,
      streak,
    }];
  }).sort((a, b) => b.streak - a.streak);
}
