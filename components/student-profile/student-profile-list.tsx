import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import type { StudentProfileListItem } from "@/lib/types/student-profile";

type StudentProfileListProps = {
  classId: string;
  students: StudentProfileListItem[];
  studentHref?: (studentId: string) => string;
  emptyMessage?: string;
};

export default function StudentProfileList({
  classId,
  students,
  studentHref,
  emptyMessage = "No active students in this class. Add students to view profiles.",
}: StudentProfileListProps) {
  if (students.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          {emptyMessage}{" "}
          <Link href={`/classes/${classId}/students`} className="text-blue-700 hover:underline">
            Add students
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {students.map((student) => (
        <Link
          key={student.id}
          href={
            studentHref
              ? studentHref(student.id)
              : `/classes/${classId}/students/${student.id}`
          }
          className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{student.full_name}</p>
              <p className="mt-1 text-sm text-slate-600">Roll No: {student.roll_no}</p>
            </div>
            <Badge variant={student.is_active ? "success" : "neutral"}>
              {student.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
