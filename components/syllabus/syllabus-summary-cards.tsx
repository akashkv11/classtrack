import Card from "@/components/ui/card";
import { StatCard } from "@/components/ui/card";
import type { SyllabusSubjectDetail } from "@/lib/types/syllabus";
import { SyllabusProgressPanel } from "@/components/syllabus/syllabus-progress-bar";

type SyllabusSummaryCardsProps = {
  summary: SyllabusSubjectDetail["summary"];
};

export default function SyllabusSummaryCards({ summary }: SyllabusSummaryCardsProps) {
  const breakdown = {
    total: summary.topics_count,
    not_started: summary.not_started_count,
    in_progress: summary.in_progress_count,
    completed: summary.completed_count,
    revised: summary.revised_count,
    skipped: summary.skipped_count,
    progress_percentage: summary.progress_percentage,
  };

  return (
    <div className="mb-8 space-y-4">
      <Card>
        <SyllabusProgressPanel
          breakdown={breakdown}
          title="Overall Progress"
          subtitle={`${summary.chapters_count} chapters · ${summary.topics_count} topics · ${summary.subtopics_count} subtopics`}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Completed" value={summary.completed_count} />
        <StatCard label="In Progress" value={summary.in_progress_count} />
        <StatCard label="Not Started" value={summary.not_started_count} />
        <StatCard label="Revised" value={summary.revised_count} />
        <StatCard label="Skipped" value={summary.skipped_count} />
      </div>
    </div>
  );
}
