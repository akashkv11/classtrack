import Link from "next/link";
import Badge from "@/components/ui/badge";

type ClassListCardProps = {
  id: string;
  displayName: string;
  studentCount: number;
  todayStatus: "marked" | "not_marked";
};

export default function ClassListCard({
  id,
  displayName,
  studentCount,
  todayStatus,
}: ClassListCardProps) {
  return (
    <Link
      href={`/classes/${id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
      <p className="mt-1 text-sm text-slate-600">{studentCount} students</p>
      <Badge variant={todayStatus === "marked" ? "success" : "warning"} className="mt-3">
        {todayStatus === "marked" ? "Today's attendance marked" : "Not marked today"}
      </Badge>
    </Link>
  );
}
