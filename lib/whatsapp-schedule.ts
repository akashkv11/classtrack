import { getExceptionForDate, getScheduleForDate } from "@/lib/timetable";
import type { TimetableEntrySummary } from "@/lib/types/timetable";

// Explicit session/diary links remain useful after a timetable is deactivated
// or its recurrence changes. Date-specific time overrides still take priority.
export function resolveWhatsAppSchedule(
  linkedEntry: TimetableEntrySummary | null,
  candidates: TimetableEntrySummary[],
  isoDate: string,
) {
  if (linkedEntry) {
    const times = getExceptionForDate(linkedEntry, isoDate) ?? linkedEntry;
    return { entry: linkedEntry, start_time: times.start_time, end_time: times.end_time };
  }

  const matches = getWhatsAppScheduleOptions(candidates, isoDate);
  return matches.length === 1 ? matches[0] : null;
}

export function getWhatsAppScheduleOptions(candidates: TimetableEntrySummary[], isoDate: string) {
  return candidates.flatMap((entry) => {
    const schedule = getScheduleForDate(entry, isoDate);
    return schedule ? [{ entry, ...schedule }] : [];
  }).sort((a, b) => a.start_time.localeCompare(b.start_time) || a.entry.id.localeCompare(b.entry.id));
}
