import Link from "next/link";

type ClassCardProps = {
  id: string;
  displayName: string;
  studentCount: number;
  todayStatus: "marked" | "not_marked";
};

export default function ClassCard({
  id,
  displayName,
  studentCount,
  todayStatus,
}: ClassCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
        <p className="mt-1 text-sm text-slate-600">{studentCount} students</p>
        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            todayStatus === "marked"
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {todayStatus === "marked" ? "Today's attendance marked" : "Not marked today"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/classes/${id}/attendance`}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Mark Attendance
        </Link>
        <Link
          href={`/classes/${id}/students`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Students
        </Link>
        <Link
          href={`/classes/${id}/reports`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Reports
        </Link>
        <Link
          href={`/classes/${id}/settings`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
