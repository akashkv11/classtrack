import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import { buildAttendanceLink, buildTeachingDiaryLink } from "@/lib/timetable/links";
import type { DashboardTodayItem } from "@/lib/types/dashboard";

type TimetableScheduleActionsProps = {
  item: Pick<
    DashboardTodayItem,
    | "class_id"
    | "entry_id"
    | "subject"
    | "start_time"
    | "end_time"
    | "attendance_status"
    | "attendance_session_id"
    | "teaching_diary_status"
    | "open_alerts_count"
  >;
  date: string;
};

export default function TimetableScheduleActions({
  item,
  date,
}: TimetableScheduleActionsProps) {
  const linkParams = {
    date,
    timetableEntryId: item.entry_id,
    subject: item.subject,
    startTime: item.start_time,
    endTime: item.end_time,
  };

  return (
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
          href={buildAttendanceLink(item.class_id, linkParams)}
          variant="primary"
          size="sm"
          className={actionButtonClassName}
        >
          Mark Attendance
        </ButtonLink>
      )}
      <ButtonLink
        href={buildTeachingDiaryLink(item.class_id, linkParams)}
        variant="secondary"
        size="sm"
        className={actionButtonClassName}
      >
        {item.teaching_diary_status === "written" ? "View Diary" : "Add Diary"}
      </ButtonLink>
      <ButtonLink
        href={`/classes/${item.class_id}/syllabus`}
        variant="secondary"
        size="sm"
        className={actionButtonClassName}
      >
        Open Syllabus
      </ButtonLink>
      {item.open_alerts_count > 0 && (
        <ButtonLink
          href={`/classes/${item.class_id}/attendance-alerts`}
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          View Alerts
        </ButtonLink>
      )}
    </ActionBar>
  );
}
