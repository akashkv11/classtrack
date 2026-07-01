import Link from "next/link";
import Badge from "@/components/ui/badge";
import { SyllabusProgressBar } from "@/components/syllabus/syllabus-progress-bar";
import type { SyllabusClassOverview } from "@/lib/types/syllabus";

type SyllabusClassCardProps = {
  overview: SyllabusClassOverview;
};

export default function SyllabusClassCard({ overview }: SyllabusClassCardProps) {
  const hasSyllabus = overview.subjects_count > 0;
  const primarySubject = overview.subjects[0]?.subject_name;

  const doneCount = overview.subjects.reduce(
    (sum, subject) => sum + subject.completed_topics_count,
    0,
  );

  const breakdown = {
    total: overview.topics_count,
    not_started: Math.max(overview.topics_count - doneCount, 0),
    in_progress: 0,
    completed: doneCount,
    revised: 0,
    skipped: 0,
    progress_percentage: overview.progress_percentage,
  };

  return (
    <Link
      href={`/classes/${overview.class_id}/syllabus`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasSyllabus ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.subjects_count} subject{overview.subjects_count === 1 ? "" : "s"}
            {primarySubject ? ` · ${primarySubject}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-600">{overview.topics_count} topics</p>
          <div className="mt-4">
            <SyllabusProgressBar
              breakdown={breakdown}
              size="sm"
              showPercentage={false}
            />
            <p className="mt-2 text-sm font-medium text-slate-700">
              {overview.progress_percentage}% complete
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">No syllabus imported yet</p>
          <Badge variant="neutral" className="mt-3">
            Set up syllabus
          </Badge>
        </>
      )}
    </Link>
  );
}
