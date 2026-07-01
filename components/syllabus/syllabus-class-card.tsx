import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { SyllabusClassOverview } from "@/lib/types/syllabus";

type SyllabusClassCardProps = {
  overview: SyllabusClassOverview;
};

export default function SyllabusClassCard({ overview }: SyllabusClassCardProps) {
  const hasSyllabus = overview.subjects_count > 0;
  const primarySubject = overview.subjects[0]?.subject_name;

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
          <Badge variant="info" className="mt-3">
            {overview.progress_percentage}% complete
          </Badge>
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
