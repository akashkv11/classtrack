import { StatCard } from "@/components/ui/card";
import type { SyllabusSubjectDetail } from "@/lib/types/syllabus";

type SyllabusSummaryCardsProps = {
  summary: SyllabusSubjectDetail["summary"];
};

export default function SyllabusSummaryCards({ summary }: SyllabusSummaryCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <StatCard label="Total Chapters" value={summary.chapters_count} />
      <StatCard label="Total Topics" value={summary.topics_count} />
      <StatCard label="Completed" value={summary.completed_count} />
      <StatCard label="In Progress" value={summary.in_progress_count} />
      <StatCard label="Not Started" value={summary.not_started_count} />
      <StatCard label="Revised" value={summary.revised_count} />
      <StatCard label="Overall Progress" value={`${summary.progress_percentage}%`} />
    </div>
  );
}
