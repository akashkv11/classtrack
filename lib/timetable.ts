import type {
  TimetableEntrySummary,
  TimetableOverlap,
  TimetableScheduleException,
} from "@/lib/types/timetable";

export const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
] as const;

export const REPEAT_DAY_VALUES = WEEKDAYS.map((day) => day.value);

export const SUBJECTS_BY_STREAM: Record<string, string[]> = {
  science: ["Computer Science"],
  commerce: ["Computer Application"],
};

export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function weekdayFromISODate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return weekdayFromDate(date);
}

export function weekdayFromDate(date: Date): string {
  const map = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[date.getDay()];
}

export function formatRepeatDays(days: string[]): string {
  const labels = new Map<string, string>(WEEKDAYS.map((day) => [day.value, day.label]));
  return days.map((day) => labels.get(day) ?? day).join(", ");
}

export function sortScheduleExceptions(
  exceptions: TimetableScheduleException[],
): TimetableScheduleException[] {
  return [...exceptions].sort((a, b) => a.date.localeCompare(b.date));
}

export function getExceptionForDate(
  entry: TimetableEntrySummary,
  isoDate: string,
): TimetableScheduleException | null {
  return entry.schedule_exceptions.find((item) => item.date === isoDate) ?? null;
}

export function subjectsForStream(stream: string): string[] {
  return SUBJECTS_BY_STREAM[stream] ?? [];
}

export function entryDateRange(entry: TimetableEntrySummary): {
  start: string;
  end: string;
} | null {
  if (entry.schedule_type === "one_time") {
    if (!entry.entry_date) return null;
    return { start: entry.entry_date, end: entry.entry_date };
  }

  if (!entry.repeat_start || !entry.repeat_end) return null;
  return { start: entry.repeat_start, end: entry.repeat_end };
}

export function entryWeekdays(entry: TimetableEntrySummary): string[] {
  if (entry.schedule_type === "one_time") {
    if (!entry.entry_date) return [];
    return [weekdayFromISODate(entry.entry_date)];
  }

  return entry.repeat_days;
}

export function entryOccursOnDate(
  entry: TimetableEntrySummary,
  isoDate: string,
): boolean {
  if (!entry.is_active) return false;

  if (entry.schedule_type === "one_time") {
    return entry.entry_date === isoDate;
  }

  const range = entryDateRange(entry);
  if (!range) return false;
  if (isoDate < range.start || isoDate > range.end) return false;

  const weekday = weekdayFromISODate(isoDate);
  return entry.repeat_days.includes(weekday);
}

export function getScheduleForDate(
  entry: TimetableEntrySummary,
  isoDate: string,
): { start_time: string; end_time: string; is_exception: boolean } | null {
  if (!entryOccursOnDate(entry, isoDate)) return null;

  const exception = getExceptionForDate(entry, isoDate);
  if (exception) {
    return {
      start_time: exception.start_time,
      end_time: exception.end_time,
      is_exception: true,
    };
  }

  return {
    start_time: entry.start_time,
    end_time: entry.end_time,
    is_exception: false,
  };
}

export function formatScheduleExceptionsSummary(
  entry: TimetableEntrySummary,
): string {
  if (entry.schedule_exceptions.length === 0) return "";

  return sortScheduleExceptions(entry.schedule_exceptions)
    .map(
      (item) =>
        `${item.date}: ${formatTime12h(item.start_time)} – ${formatTime12h(item.end_time)}`,
    )
    .join(" · ");
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA;
}

export function dateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && startB <= endA;
}

function sharedWeekdays(a: TimetableEntrySummary, b: TimetableEntrySummary): string[] {
  const daysA = entryWeekdays(a);
  const daysB = entryWeekdays(b);
  return daysA.filter((day) => daysB.includes(day));
}

function entriesOverlapOnDate(
  a: TimetableEntrySummary,
  b: TimetableEntrySummary,
  isoDate: string,
): TimetableOverlap | null {
  const scheduleA = getScheduleForDate(a, isoDate);
  const scheduleB = getScheduleForDate(b, isoDate);
  if (!scheduleA || !scheduleB) return null;

  if (
    !timesOverlap(
      scheduleA.start_time,
      scheduleA.end_time,
      scheduleB.start_time,
      scheduleB.end_time,
    )
  ) {
    return null;
  }

  return {
    entry_id: b.id,
    class_name: b.class_name,
    subject: b.subject,
    date: isoDate,
    start_time: scheduleB.start_time,
    end_time: scheduleB.end_time,
  };
}

export function entriesOverlap(
  a: TimetableEntrySummary,
  b: TimetableEntrySummary,
): TimetableOverlap | null {
  if (!a.is_active || !b.is_active) return null;
  if (a.id === b.id) return null;

  const rangeA = entryDateRange(a);
  const rangeB = entryDateRange(b);
  if (!rangeA || !rangeB) return null;
  if (!dateRangesOverlap(rangeA.start, rangeA.end, rangeB.start, rangeB.end)) {
    return null;
  }

  const datesToCheck = new Set<string>([
    ...a.schedule_exceptions.map((item) => item.date),
    ...b.schedule_exceptions.map((item) => item.date),
  ]);

  if (a.schedule_type === "one_time" && a.entry_date) datesToCheck.add(a.entry_date);
  if (b.schedule_type === "one_time" && b.entry_date) datesToCheck.add(b.entry_date);

  for (const isoDate of datesToCheck) {
    const overlap = entriesOverlapOnDate(a, b, isoDate);
    if (overlap) return overlap;
  }

  const sharedDays = sharedWeekdays(a, b);
  if (
    sharedDays.length > 0 &&
    timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)
  ) {
    return {
      entry_id: b.id,
      class_name: b.class_name,
      subject: b.subject,
      date: null,
      start_time: b.start_time,
      end_time: b.end_time,
    };
  }

  return null;
}

export function findOverlappingEntries(
  entry: TimetableEntrySummary,
  allEntries: TimetableEntrySummary[],
  excludeId?: string,
): TimetableOverlap[] {
  return allEntries
    .filter((candidate) => candidate.id !== excludeId)
    .map((candidate) => entriesOverlap(entry, candidate))
    .filter((overlap): overlap is TimetableOverlap => overlap !== null);
}

export function groupEntriesByWeekday(
  entries: TimetableEntrySummary[],
  options?: { activeOnly?: boolean },
): Record<string, TimetableEntrySummary[]> {
  const activeOnly = options?.activeOnly ?? true;
  const grouped: Record<string, TimetableEntrySummary[]> = {};

  for (const day of WEEKDAYS) {
    grouped[day.value] = [];
  }

  for (const entry of entries) {
    if (activeOnly && !entry.is_active) continue;

    if (entry.schedule_type === "one_time" && entry.entry_date) {
      const day = weekdayFromISODate(entry.entry_date);
      if (grouped[day]) grouped[day].push(entry);
    } else if (entry.schedule_type === "repeating") {
      for (const day of entry.repeat_days) {
        if (grouped[day]) grouped[day].push(entry);
      }
    }
  }

  for (const day of WEEKDAYS) {
    grouped[day.value].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return grouped;
}

export function filterTimetableEntries(
  entries: TimetableEntrySummary[],
  filters: { classId?: string; subject?: string; activeOnly?: boolean },
): TimetableEntrySummary[] {
  return entries.filter((entry) => {
    if (filters.activeOnly && !entry.is_active) return false;
    if (filters.classId && entry.class_id !== filters.classId) return false;
    if (filters.subject && entry.subject !== filters.subject) return false;
    return true;
  });
}

export function exceptionOccursOnRepeatingEntry(
  entry: TimetableEntrySummary,
  exceptionDate: string,
): boolean {
  if (entry.schedule_type !== "repeating") return false;
  return entryOccursOnDate({ ...entry, schedule_exceptions: [] }, exceptionDate);
}
