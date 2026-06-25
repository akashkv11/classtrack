import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { formatTime12h } from "@/lib/timetable";
import type { TodayScheduleItem } from "@/lib/types/timetable";

type TodayScheduleProps = {
  items: TodayScheduleItem[];
};

export default function TodaySchedule({ items }: TodayScheduleProps) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          No classes scheduled for today. Add entries in Timetable to see your daily
          schedule here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.entry_id} padding="lg">
          <p className="text-sm font-medium text-slate-500">
            Period {item.period_number} · {formatTime12h(item.start_time)} –{" "}
            {formatTime12h(item.end_time)}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {item.class_name} · {item.subject}
          </p>
          {item.has_time_exception && (
            <p className="mt-1 text-xs text-amber-800">One-time time change for today</p>
          )}

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p className="text-slate-700">
              Attendance:{" "}
              <span className="font-medium text-slate-900">
                {item.attendance_status === "marked" ? "Marked" : "Not marked"}
              </span>
            </p>
            <p className="text-slate-700">
              Teaching Diary:{" "}
              <span className="font-medium text-slate-900">
                {item.teaching_diary_status === "written" ? "Written" : "Pending"}
              </span>
            </p>
          </div>

          <ActionBar className="mt-4">
            {item.attendance_status === "marked" && item.attendance_session_id ? (
              <ButtonLink
                href={`/classes/${item.class_id}/summary/${item.attendance_session_id}`}
                variant="secondary"
                size="sm"
                className={actionButtonClassName}
              >
                View Attendance
              </ButtonLink>
            ) : (
              <ButtonLink
                href={`/classes/${item.class_id}/attendance`}
                variant="primary"
                size="sm"
                className={actionButtonClassName}
              >
                Mark Attendance
              </ButtonLink>
            )}
            <ButtonLink
              href="/teaching-diary"
              variant="secondary"
              size="sm"
              className={actionButtonClassName}
            >
              Write Diary
            </ButtonLink>
          </ActionBar>
        </Card>
      ))}
    </div>
  );
}
