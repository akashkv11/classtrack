import Card from "@/components/ui/card";
import { StatusBadgeFromConfig } from "@/components/ui/status-badge";
import TimetableScheduleActions from "@/components/timetable/timetable-schedule-actions";
import { formatTime12h } from "@/lib/timetable";
import { attendanceMarkedStatus, diaryAddedStatus } from "@/lib/ui/status-badges";
import type { DashboardTodayItem } from "@/lib/types/dashboard";

type TimetableScheduleCardProps = {
  item: DashboardTodayItem;
  date: string;
  showPeriodNumber?: boolean;
};

export default function TimetableScheduleCard({
  item,
  date,
  showPeriodNumber = false,
}: TimetableScheduleCardProps) {
  const attendancePending = item.attendance_status === "not_marked";
  const diaryPending = item.teaching_diary_status === "pending";

  return (
    <Card
      padding="lg"
      className={
        attendancePending || diaryPending ? "border-amber-200 bg-amber-50/20" : undefined
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {showPeriodNumber && (
              <span className="mr-2">Period {item.period_number} ·</span>
            )}
            {formatTime12h(item.start_time)} – {formatTime12h(item.end_time)}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {item.class_name} · {item.subject}
          </p>
          {item.has_time_exception && (
            <p className="mt-1 text-xs text-amber-800">One-time time change for today</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadgeFromConfig
            status={attendanceMarkedStatus(item.attendance_status === "marked")}
          />
          <StatusBadgeFromConfig
            status={diaryAddedStatus(item.teaching_diary_status === "written")}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        {item.attendance_status === "marked" && item.attendance_present !== null && (
          <p>
            <span className="font-medium text-slate-900">Attendance:</span>{" "}
            {item.attendance_present} present
            {item.attendance_absent !== null && item.attendance_absent > 0 && (
              <> · {item.attendance_absent} absent</>
            )}
            {item.attendance_late !== null && item.attendance_late > 0 && (
              <> · {item.attendance_late} late</>
            )}
          </p>
        )}

        {attendancePending && (
          <p className="font-medium text-amber-900">Attendance not marked for this class.</p>
        )}

        {diaryPending && (
          <p className="font-medium text-amber-900">Teaching diary not added for this period.</p>
        )}

        {item.suggested_next_topic && (
          <p>
            <span className="font-medium text-slate-900">Suggested next topic:</span>{" "}
            {item.suggested_next_topic}
          </p>
        )}

        {item.next_class_plan && diaryPending && (
          <p>
            <span className="font-medium text-slate-900">Last class plan:</span>{" "}
            {item.next_class_plan}
          </p>
        )}

        {item.open_alerts_count > 0 && (
          <p>
            <span className="font-medium text-slate-900">Open alerts:</span>{" "}
            {item.open_alerts_count} student{item.open_alerts_count === 1 ? "" : "s"} need
            follow-up
            {item.top_alert_preview && (
              <span className="block text-slate-600">{item.top_alert_preview}</span>
            )}
          </p>
        )}
      </div>

      <TimetableScheduleActions item={item} date={date} />
    </Card>
  );
}
