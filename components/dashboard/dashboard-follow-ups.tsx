import Card from "@/components/ui/card";
import type { DashboardFollowUpSummary } from "@/lib/types/dashboard";

type DashboardFollowUpsProps = {
  summary: DashboardFollowUpSummary;
};

export default function DashboardFollowUps({ summary }: DashboardFollowUpsProps) {
  const hasFollowUps =
    summary.open_student_notes > 0 ||
    summary.overdue_student_notes > 0 ||
    summary.open_parent_follow_ups > 0 ||
    summary.overdue_parent_follow_ups > 0 ||
    summary.open_attendance_alerts > 0;

  if (!hasFollowUps) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/50">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
        Pending Follow-ups
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-amber-950">
        {summary.open_attendance_alerts > 0 && (
          <li>
            {summary.open_attendance_alerts} open attendance alert
            {summary.open_attendance_alerts === 1 ? "" : "s"}
          </li>
        )}
        {summary.open_student_notes > 0 && (
          <li>
            {summary.open_student_notes} open student note
            {summary.open_student_notes === 1 ? "" : "s"}
          </li>
        )}
        {summary.overdue_student_notes > 0 && (
          <li>
            {summary.overdue_student_notes} overdue student follow-up
            {summary.overdue_student_notes === 1 ? "" : "s"}
          </li>
        )}
        {summary.open_parent_follow_ups > 0 && (
          <li>
            {summary.open_parent_follow_ups} parent follow-up
            {summary.open_parent_follow_ups === 1 ? "" : "s"} pending
          </li>
        )}
        {summary.overdue_parent_follow_ups > 0 && (
          <li>
            {summary.overdue_parent_follow_ups} overdue parent follow-up
            {summary.overdue_parent_follow_ups === 1 ? "" : "s"}
          </li>
        )}
      </ul>
    </Card>
  );
}
