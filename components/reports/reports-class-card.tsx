import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { ReportsClassOverview } from "@/lib/types/report";

type ReportsClassCardProps = {
  overview: ReportsClassOverview;
};

export default function ReportsClassCard({ overview }: ReportsClassCardProps) {
  const hasData =
    overview.syllabus_subjects_count > 0 || overview.diary_entries_count > 0;

  return (
    <Link
      href={`/classes/${overview.class_id}/reports`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasData ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.syllabus_subjects_count} subject
            {overview.syllabus_subjects_count === 1 ? "" : "s"} ·{" "}
            {overview.diary_entries_count} diary entr
            {overview.diary_entries_count === 1 ? "y" : "ies"}
          </p>
          {overview.syllabus_progress_percentage != null && (
            <p className="mt-1 text-sm text-slate-600">
              Syllabus progress: {overview.syllabus_progress_percentage}%
            </p>
          )}
          <Badge variant="success" className="mt-3">
            View reports
          </Badge>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">No academic data yet</p>
          <Badge variant="neutral" className="mt-3">
            Open reports
          </Badge>
        </>
      )}
    </Link>
  );
}
