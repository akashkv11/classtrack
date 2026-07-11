import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { StudentNotesClassOverview } from "@/lib/types/student-note";

type StudentNotesClassCardProps = {
  overview: StudentNotesClassOverview;
};

export default function StudentNotesClassCard({ overview }: StudentNotesClassCardProps) {
  const hasStudents = overview.student_count > 0;

  return (
    <Link
      href={`/classes/${overview.class_id}/student-notes`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasStudents ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.notes_count} note{overview.notes_count === 1 ? "" : "s"}
            {overview.open_notes_count > 0 &&
              ` · ${overview.open_notes_count} open`}
          </p>
          <Badge variant={overview.notes_count > 0 ? "success" : "neutral"} className="mt-3">
            {overview.notes_count > 0 ? "View notes" : "Add notes"}
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
