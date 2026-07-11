import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { ButtonLink } from "@/components/ui/button";
import Card from "@/components/ui/card";
import type { DashboardClassCard } from "@/lib/types/dashboard";

type DashboardClassCardProps = {
  card: DashboardClassCard;
  lowMarksThresholdPercent: number;
};

function statusLine(label: string, value: string) {
  return (
    <p>
      <span className="font-medium text-slate-900">{label}:</span> {value}
    </p>
  );
}

export default function DashboardClassCard({
  card,
  lowMarksThresholdPercent,
}: DashboardClassCardProps) {
  const attendanceLine = card.attendance_marked_today
    ? `Marked${
        card.attendance_present !== null
          ? ` · ${card.attendance_present} present${
              card.attendance_absent !== null && card.attendance_absent > 0
                ? ` · ${card.attendance_absent} absent`
                : ""
            }`
          : ""
      }`
    : "Not marked";

  const diaryLine = card.diary_added_today ? "Added" : "Not added";

  const syllabusLine =
    card.syllabus_progress_percentage !== null
      ? `${card.syllabus_progress_percentage}% completed${
          card.important_topics_pending > 0
            ? ` · ${card.important_topics_pending} important topic${
                card.important_topics_pending === 1 ? "" : "s"
              } pending`
            : ""
        }`
      : "No syllabus yet";

  const alertParts: string[] = [];
  if (card.open_attendance_alerts > 0) {
    alertParts.push(
      `${card.open_attendance_alerts} open attendance alert${
        card.open_attendance_alerts === 1 ? "" : "s"
      }`,
    );
  }
  const followUpTotal = card.open_student_notes + card.open_parent_follow_ups;
  if (followUpTotal > 0) {
    alertParts.push(
      `${followUpTotal} student follow-up${followUpTotal === 1 ? "" : "s"}`,
    );
  }

  return (
    <Card padding="lg" className="h-full">
      <h3 className="text-lg font-semibold text-slate-900">{card.display_name}</h3>
      <p className="mt-1 text-sm text-slate-600">{card.student_count} students</p>

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Today
          </p>
          {statusLine("Attendance", attendanceLine)}
          {statusLine("Teaching diary", diaryLine)}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Academic
          </p>
          {statusLine("Syllabus", syllabusLine)}
          {card.last_topic_taught && statusLine("Last topic", card.last_topic_taught)}
          {card.next_class_plan && statusLine("Next plan", card.next_class_plan)}
          {card.latest_assessment_name && card.latest_assessment_average !== null && (
            <p>
              <span className="font-medium text-slate-900">Latest test:</span>{" "}
              {card.latest_assessment_name} · average {card.latest_assessment_average}
              {card.latest_assessment_max_marks !== null &&
                ` / ${card.latest_assessment_max_marks}`}
              {card.latest_assessment_below_40_count !== null &&
                card.latest_assessment_below_40_count > 0 && (
                  <>
                    {" "}
                    · {card.latest_assessment_below_40_count} below{" "}
                    {lowMarksThresholdPercent}%
                  </>
                )}
            </p>
          )}
        </div>

        {alertParts.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Alerts
            </p>
            <p>{alertParts.join(" · ")}</p>
          </div>
        )}
      </div>

      <ActionBar className="mt-4">
        {card.attendance_marked_today && card.attendance_session_id ? (
          <ButtonLink
            href={`/classes/${card.class_id}/summary/${card.attendance_session_id}`}
            variant="secondary"
            size="sm"
            className={actionButtonClassName}
          >
            View Summary
          </ButtonLink>
        ) : (
          <ButtonLink
            href={`/classes/${card.class_id}/attendance`}
            variant="primary"
            size="sm"
            className={actionButtonClassName}
          >
            Mark Attendance
          </ButtonLink>
        )}
        <ButtonLink
          href={`/classes/${card.class_id}/teaching-diary`}
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          {card.diary_added_today ? "View Diary" : "Add Diary"}
        </ButtonLink>
        {card.open_attendance_alerts > 0 && (
          <ButtonLink
            href={`/classes/${card.class_id}/attendance-alerts`}
            variant="secondary"
            size="sm"
            className={actionButtonClassName}
          >
            View Alerts
          </ButtonLink>
        )}
        <ButtonLink
          href={`/classes/${card.class_id}`}
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          Open Class
        </ButtonLink>
      </ActionBar>
    </Card>
  );
}
