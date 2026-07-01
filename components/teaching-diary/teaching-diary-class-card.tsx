import Link from "next/link";
import Badge from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/dates";
import type { TeachingDiaryClassOverview } from "@/lib/types/teaching-diary";

type TeachingDiaryClassCardProps = {
  overview: TeachingDiaryClassOverview;
};

export default function TeachingDiaryClassCard({ overview }: TeachingDiaryClassCardProps) {
  const hasEntries = overview.entries_count > 0;

  return (
    <Link
      href={`/classes/${overview.class_id}/teaching-diary`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h2 className="text-lg font-semibold text-slate-900">{overview.display_name}</h2>

      {hasEntries ? (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {overview.entries_count} entr{overview.entries_count === 1 ? "y" : "ies"}
          </p>
          {overview.latest_entry_date && (
            <p className="mt-1 text-sm text-slate-600">
              Latest:{" "}
              {formatDisplayDate(new Date(overview.latest_entry_date + "T00:00:00Z"))}
            </p>
          )}
          <Badge variant="success" className="mt-3">
            View diary
          </Badge>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">No diary entries yet</p>
          <Badge variant="neutral" className="mt-3">
            Add first entry
          </Badge>
        </>
      )}
    </Link>
  );
}
