import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { AttendanceAlertsClassOverview } from "@/lib/types/attendance-alert";

type AttendanceAlertsClassCardProps = {
  overview: AttendanceAlertsClassOverview;
};

export default function AttendanceAlertsClassCard({
  overview,
}: AttendanceAlertsClassCardProps) {
  const hasStudents = overview.student_count > 0;
  const href = hasStudents
    ? `/classes/${overview.class_id}/attendance-alerts`
    : `/classes/${overview.class_id}/students`;

  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasStudents ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.total_alerts_count} alert
            {overview.total_alerts_count === 1 ? "" : "s"}
            {overview.open_alerts_count > 0 &&
              ` · ${overview.open_alerts_count} open`}
          </p>
          <Badge
            variant={overview.open_alerts_count > 0 ? "warning" : "neutral"}
            className="mt-3"
          >
            {overview.open_alerts_count > 0 ? "Review alerts" : "View alerts"}
          </Badge>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">No students yet</p>
          <Badge variant="neutral" className="mt-3">
            Add students
          </Badge>
        </>
      )}
    </Link>
  );
}
