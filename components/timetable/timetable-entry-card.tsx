import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  formatRepeatDays,
  formatScheduleExceptionsSummary,
  formatTime12h,
} from "@/lib/timetable";
import type { TimetableEntrySummary } from "@/lib/types/timetable";

type TimetableEntryCardProps = {
  entry: TimetableEntrySummary;
  onEdit?: (entry: TimetableEntrySummary) => void;
  onDisable?: (entry: TimetableEntrySummary) => void;
};

export default function TimetableEntryCard({
  entry,
  onEdit,
  onDisable,
}: TimetableEntryCardProps) {
  const scheduleLabel =
    entry.schedule_type === "repeating"
      ? `Repeats ${formatRepeatDays(entry.repeat_days)}`
      : entry.entry_date
        ? `One-time · ${entry.entry_date}`
        : "One-time";

  return (
    <Card padding="sm" className={!entry.is_active ? "opacity-60" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {formatTime12h(entry.start_time)} – {formatTime12h(entry.end_time)}
          </p>
          <p className="mt-1 text-sm text-slate-700">{entry.class_name}</p>
          <p className="text-sm text-slate-600">{entry.subject}</p>
          <p className="mt-1 text-xs text-slate-500">
            {scheduleLabel}
            {!entry.is_active ? " · Disabled" : ""}
          </p>
          {entry.schedule_exceptions.length > 0 && (
            <p className="mt-1 text-xs text-amber-800">
              One-time changes: {formatScheduleExceptionsSummary(entry)}
            </p>
          )}
          {entry.notes && (
            <p className="mt-1 text-xs text-slate-500">{entry.notes}</p>
          )}
        </div>
        {entry.is_active && onEdit && onDisable && (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(entry)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onDisable(entry)}
            >
              Disable
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
