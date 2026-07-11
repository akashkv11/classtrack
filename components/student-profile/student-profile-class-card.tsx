import Link from "next/link";
import Badge from "@/components/ui/badge";
import type { StudentProfileClassOverview } from "@/lib/types/student-profile";

type StudentProfileClassCardProps = {
  overview: StudentProfileClassOverview;
};

export default function StudentProfileClassCard({
  overview,
}: StudentProfileClassCardProps) {
  const hasStudents = overview.student_count > 0;

  return (
    <Link
      href={`/classes/${overview.class_id}/students`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasStudents ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.student_count} student
            {overview.student_count === 1 ? "" : "s"}
          </p>
          <Badge variant="success" className="mt-3">
            View students
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
