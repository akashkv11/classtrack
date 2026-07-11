import Card, { StatCard } from "@/components/ui/card";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { SyllabusProgressReport } from "@/lib/types/report";

type SyllabusProgressReportViewProps = {
  report: SyllabusProgressReport;
};

function chapterLabel(chapter: SyllabusProgressReport["chapters"][number]) {
  return chapter.chapter_number
    ? `Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`
    : chapter.chapter_title;
}

export default function SyllabusProgressReportView({
  report,
}: SyllabusProgressReportViewProps) {
  const { summary } = report;

  return (
    <div className="space-y-6">
      <div className="print:block">
        <p className="mb-1 text-sm text-slate-500">Class</p>
        <p className="text-lg font-semibold text-slate-900">{report.class.display_name}</p>
        {report.subject && (
          <p className="mt-1 text-sm text-slate-700">Subject: {report.subject.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Topics" value={summary.total_topics} />
        <StatCard label="Completed" value={summary.completed} />
        <StatCard label="In Progress" value={summary.in_progress} />
        <StatCard label="Pending" value={summary.pending} />
        <StatCard label="Revised" value={summary.revised} />
        <StatCard label="Progress" value={`${summary.progress_percentage}%`} />
      </div>

      {report.chapters.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">No syllabus chapters found for this class.</p>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Chapter-wise Progress
          </h2>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Chapter</TableHeaderCell>
                <TableHeaderCell>Topics</TableHeaderCell>
                <TableHeaderCell>Completed</TableHeaderCell>
                <TableHeaderCell>In Progress</TableHeaderCell>
                <TableHeaderCell>Pending</TableHeaderCell>
                <TableHeaderCell>Progress</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {report.chapters.map((chapter) => (
                <TableRow key={`${chapter.chapter_number}-${chapter.chapter_title}`}>
                  <TableCell>{chapterLabel(chapter)}</TableCell>
                  <TableCell>{chapter.topics_total}</TableCell>
                  <TableCell>{chapter.topics_completed}</TableCell>
                  <TableCell>{chapter.topics_in_progress}</TableCell>
                  <TableCell>{chapter.topics_pending}</TableCell>
                  <TableCell className="font-medium">{chapter.progress_percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
