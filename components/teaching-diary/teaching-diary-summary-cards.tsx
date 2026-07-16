import { StatCard } from "@/components/ui/card";
import type { TeachingDiarySummary } from "@/lib/types/teaching-diary";

type TeachingDiarySummaryCardsProps = {
  summary: TeachingDiarySummary;
};

export default function TeachingDiarySummaryCards({
  summary,
}: TeachingDiarySummaryCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Total Entries" value={summary.total_entries} />
      <StatCard label="Topics Taught" value={summary.topics_completed} />
      <StatCard label="Partial Topics" value={summary.topics_in_progress} />
      <StatCard label="Chapter Revisions" value={summary.revision_entries} />
      <StatCard label="Exams" value={summary.exam_entries} />
    </div>
  );
}
