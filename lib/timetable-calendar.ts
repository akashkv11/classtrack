import { formatISODate, parseISODate } from "@/lib/dates";
import { getScheduleForDate } from "@/lib/timetable";
import type { TimetableEntrySummary } from "@/lib/types/timetable";

export function hideCompletedOneTimeEntries(entries: TimetableEntrySummary[], date: string, time: string) {
  return entries.filter((entry) => entry.schedule_type !== "one_time" ||
    (entry.entry_date !== null && (entry.entry_date > date ||
      (entry.entry_date === date && entry.end_time > time))));
}

export function getTimetableWeek(anchor: string, offset = 0): string[] {
  const monday = parseISODate(anchor);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() + index);
    return formatISODate(date);
  });
}

export function getTimetableDay(entries: TimetableEntrySummary[], date: string) {
  return entries.flatMap((entry) => {
    const schedule = getScheduleForDate(entry, date);
    return schedule ? [{ entry, ...schedule }] : [];
  }).sort((a, b) => a.start_time.localeCompare(b.start_time) || a.entry.class_name.localeCompare(b.entry.class_name));
}
