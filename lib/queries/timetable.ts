import type { Prisma } from "@/app/generated/prisma/client";
import type { TimetableEntry } from "@/app/generated/prisma/client";
import { formatISODate, parseISODate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { entryOccursOnDate, getScheduleForDate, sortScheduleExceptions } from "@/lib/timetable";
import type {
  ScheduleType,
  TimetableEntrySummary,
  TimetableScheduleException,
  TodayScheduleItem,
} from "@/lib/types/timetable";
import { getActiveAcademicYear } from "@/lib/queries/classes";

type TimetableEntryWithClass = TimetableEntry & {
  class: { displayName: string };
};

function parseScheduleExceptions(value: unknown): TimetableScheduleException[] {
  if (!Array.isArray(value)) return [];

  const exceptions: TimetableScheduleException[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === "object" &&
      "date" in item &&
      "start_time" in item &&
      "end_time" in item &&
      typeof item.date === "string" &&
      typeof item.start_time === "string" &&
      typeof item.end_time === "string"
    ) {
      exceptions.push({
        date: item.date,
        start_time: item.start_time,
        end_time: item.end_time,
        notes:
          "notes" in item && typeof item.notes === "string" ? item.notes : undefined,
      });
    }
  }

  return sortScheduleExceptions(exceptions);
}

export function serializeTimetableEntry(
  entry: TimetableEntryWithClass,
): TimetableEntrySummary {
  return {
    id: entry.id,
    class_id: entry.classId,
    class_name: entry.class.displayName,
    subject: entry.subject,
    schedule_type: entry.scheduleType as ScheduleType,
    entry_date: entry.entryDate ? formatISODate(entry.entryDate) : null,
    start_time: entry.startTime,
    end_time: entry.endTime,
    repeat_days: entry.repeatDays,
    schedule_exceptions: parseScheduleExceptions(entry.scheduleExceptions),
    repeat_start: entry.repeatStart ? formatISODate(entry.repeatStart) : null,
    repeat_end: entry.repeatEnd ? formatISODate(entry.repeatEnd) : null,
    notes: entry.notes,
    is_active: entry.isActive,
  };
}

export async function getTimetableEntries(options?: {
  activeOnly?: boolean;
  classId?: string;
  subject?: string;
}) {
  const activeYear = await getActiveAcademicYear();
  if (!activeYear) return [];

  const entries = await prisma.timetableEntry.findMany({
    where: {
      class: { academicYearId: activeYear.id },
      ...(options?.activeOnly ? { isActive: true } : {}),
      ...(options?.classId ? { classId: options.classId } : {}),
      ...(options?.subject ? { subject: options.subject } : {}),
    },
    include: { class: { select: { displayName: true } } },
    orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
  });

  return entries.map(serializeTimetableEntry);
}

export async function getTimetableEntryById(entryId: string) {
  const entry = await prisma.timetableEntry.findUnique({
    where: { id: entryId },
    include: { class: { select: { displayName: true } } },
  });

  if (!entry) return null;
  return serializeTimetableEntry(entry);
}

export async function getTodaySchedule(isoDate: string): Promise<TodayScheduleItem[]> {
  const entries = await getTimetableEntries({ activeOnly: true });
  const todaysEntries = entries
    .filter((entry) => entryOccursOnDate(entry, isoDate))
    .map((entry) => ({
      entry,
      schedule: getScheduleForDate(entry, isoDate)!,
    }))
    .sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time));

  if (todaysEntries.length === 0) return [];

  const classIds = [
    ...new Set(todaysEntries.map(({ entry }) => entry.class_id)),
  ] as string[];
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId: { in: classIds },
      attendanceDate: parseISODate(isoDate),
    },
    select: { id: true, classId: true },
  });

  const sessionByClassId = new Map(sessions.map((s) => [s.classId, s.id]));

  return todaysEntries.map(({ entry, schedule }, index) => {
    const sessionId = sessionByClassId.get(entry.class_id) ?? null;
    return {
      entry_id: entry.id,
      period_number: index + 1,
      class_id: entry.class_id,
      class_name: entry.class_name,
      subject: entry.subject,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      schedule_type: entry.schedule_type,
      has_time_exception: schedule.is_exception,
      attendance_status: sessionId ? "marked" : "not_marked",
      attendance_session_id: sessionId,
      teaching_diary_status: "pending",
    };
  });
}

type TimetableWriteInput = {
  class_id: string;
  subject: string;
  schedule_type: ScheduleType;
  entry_date?: string;
  repeat_days?: string[];
  schedule_exceptions?: TimetableScheduleException[];
  repeat_start?: string;
  repeat_end?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
};

export function buildTimetableCreateData(data: TimetableWriteInput) {
  const isOneTime = data.schedule_type === "one_time";
  const exceptions = isOneTime ? [] : sortScheduleExceptions(data.schedule_exceptions ?? []);

  return {
    classId: data.class_id,
    subject: data.subject,
    scheduleType: data.schedule_type,
    entryDate: isOneTime && data.entry_date ? parseISODate(data.entry_date) : null,
    startTime: data.start_time ?? "09:00",
    endTime: data.end_time ?? "10:00",
    repeatDays: isOneTime ? [] : (data.repeat_days ?? []),
    scheduleExceptions: exceptions as Prisma.InputJsonValue,
    repeatStart:
      !isOneTime && data.repeat_start ? parseISODate(data.repeat_start) : null,
    repeatEnd: !isOneTime && data.repeat_end ? parseISODate(data.repeat_end) : null,
    notes: data.notes?.trim() || null,
    isActive: true,
  };
}

export function buildTimetableUpdateData(
  existing: TimetableEntrySummary,
  patch: {
    class_id?: string;
    subject?: string;
    schedule_type?: ScheduleType;
    entry_date?: string | null;
    repeat_days?: string[];
    schedule_exceptions?: TimetableScheduleException[];
    repeat_start?: string | null;
    repeat_end?: string | null;
    start_time?: string;
    end_time?: string;
    notes?: string | null;
    is_active?: boolean;
  },
) {
  const merged = {
    class_id: patch.class_id ?? existing.class_id,
    subject: patch.subject ?? existing.subject,
    schedule_type: patch.schedule_type ?? existing.schedule_type,
    entry_date:
      patch.entry_date !== undefined ? patch.entry_date : existing.entry_date,
    repeat_days: patch.repeat_days ?? existing.repeat_days,
    schedule_exceptions: patch.schedule_exceptions ?? existing.schedule_exceptions,
    repeat_start:
      patch.repeat_start !== undefined ? patch.repeat_start : existing.repeat_start,
    repeat_end: patch.repeat_end !== undefined ? patch.repeat_end : existing.repeat_end,
    start_time: patch.start_time ?? existing.start_time,
    end_time: patch.end_time ?? existing.end_time,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
  };

  const isOneTime = merged.schedule_type === "one_time";
  const exceptions = isOneTime
    ? []
    : sortScheduleExceptions(merged.schedule_exceptions);

  return {
    data: {
      classId: merged.class_id,
      subject: merged.subject,
      scheduleType: merged.schedule_type,
      entryDate:
        isOneTime && merged.entry_date ? parseISODate(merged.entry_date) : null,
      startTime: merged.start_time,
      endTime: merged.end_time,
      repeatDays: isOneTime ? [] : merged.repeat_days,
      scheduleExceptions: exceptions as Prisma.InputJsonValue,
      repeatStart:
        !isOneTime && merged.repeat_start
          ? parseISODate(merged.repeat_start)
          : null,
      repeatEnd:
        !isOneTime && merged.repeat_end ? parseISODate(merged.repeat_end) : null,
      notes: merged.notes?.trim() || null,
      ...(patch.is_active !== undefined ? { isActive: patch.is_active } : {}),
    },
    merged: {
      ...merged,
      schedule_exceptions: exceptions,
    },
  };
}

export function summaryFromWriteInput(
  className: string,
  data: TimetableWriteInput,
  id = "draft",
): TimetableEntrySummary {
  const isOneTime = data.schedule_type === "one_time";

  return {
    id,
    class_id: data.class_id,
    class_name: className,
    subject: data.subject,
    schedule_type: data.schedule_type,
    entry_date: isOneTime ? (data.entry_date ?? null) : null,
    start_time: data.start_time ?? "09:00",
    end_time: data.end_time ?? "10:00",
    repeat_days: isOneTime ? [] : (data.repeat_days ?? []),
    schedule_exceptions: isOneTime
      ? []
      : sortScheduleExceptions(data.schedule_exceptions ?? []),
    repeat_start: isOneTime ? null : (data.repeat_start ?? null),
    repeat_end: isOneTime ? null : (data.repeat_end ?? null),
    notes: data.notes ?? null,
    is_active: true,
  };
}
