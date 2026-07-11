import { StatCard } from "@/components/ui/card";
import type { AssessmentResultSummary } from "@/lib/types/assessment";

type AssessmentSummaryCardsProps = {
  summary: AssessmentResultSummary;
  maxMarks: number;
  lowMarksThresholdPercent?: number;
};

export default function AssessmentSummaryCards({
  summary,
  maxMarks,
  lowMarksThresholdPercent = 40,
}: AssessmentSummaryCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Class Average"
        value={
          summary.class_average !== null
            ? `${summary.class_average} / ${maxMarks}`
            : "—"
        }
      />
      <StatCard
        label="Highest"
        value={summary.highest !== null ? summary.highest : "—"}
      />
      <StatCard
        label="Lowest"
        value={summary.lowest !== null ? summary.lowest : "—"}
      />
      <StatCard
        label={`Below ${lowMarksThresholdPercent}%`}
        value={summary.below_40_percent_count}
      />
      <StatCard label="Absent" value={summary.absent_count} />
    </div>
  );
}
