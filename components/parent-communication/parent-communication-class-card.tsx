import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { ParentCommunicationClassOverview } from "@/lib/types/parent-communication";

type ParentCommunicationClassCardProps = {
  overview: ParentCommunicationClassOverview;
};

export default function ParentCommunicationClassCard({
  overview,
}: ParentCommunicationClassCardProps) {
  const hasStudents = overview.student_count > 0;

  return (
    <Link
      href={`/classes/${overview.class_id}/parent-communication`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasStudents ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.communications_count} communication
            {overview.communications_count === 1 ? "" : "s"}
            {overview.open_follow_ups_count > 0 &&
              ` · ${overview.open_follow_ups_count} open follow-up${overview.open_follow_ups_count === 1 ? "" : "s"}`}
          </p>
          <Badge
            variant={overview.communications_count > 0 ? "success" : "neutral"}
            className="mt-3"
          >
            {overview.communications_count > 0
              ? "View communications"
              : "Add communication"}
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
