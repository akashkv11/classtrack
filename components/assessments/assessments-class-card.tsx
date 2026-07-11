import Link from "next/link";
import Badge from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/dates";
import type { AssessmentClassOverview } from "@/lib/types/assessment";

type AssessmentsClassCardProps = {
  overview: AssessmentClassOverview;
};

export default function AssessmentsClassCard({ overview }: AssessmentsClassCardProps) {
  const hasAssessments = overview.assessments_count > 0;

  return (
    <Link
      href={`/classes/${overview.class_id}/assessments`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasAssessments ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.assessments_count} assessment
            {overview.assessments_count === 1 ? "" : "s"}
          </p>
          {overview.latest_assessment_date && (
            <p className="mt-1 text-sm text-slate-600">
              Latest:{" "}
              {formatDisplayDate(
                new Date(overview.latest_assessment_date + "T00:00:00Z"),
              )}
            </p>
          )}
          <Badge variant="success" className="mt-3">
            View assessments
          </Badge>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">No assessments yet</p>
          <Badge variant="neutral" className="mt-3">
            Create first assessment
          </Badge>
        </>
      )}
    </Link>
  );
}
