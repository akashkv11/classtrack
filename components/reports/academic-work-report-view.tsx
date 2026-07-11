import Card, { StatCard } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import type { MonthlyAcademicWorkReport } from "@/lib/types/report";
import TeachingDiaryReportView from "@/components/reports/teaching-diary-report-view";

type AcademicWorkReportViewProps = {
  report: MonthlyAcademicWorkReport;
};

export default function AcademicWorkReportView({ report }: AcademicWorkReportViewProps) {
  const diaryReport = {
    class: report.class,
    month: report.month,
    subject: report.subject,
    entries: report.diary_entries,
    summary: {
      total_entries: report.topics_taught_this_month,
      topics_taught: report.topics_completed_this_month,
      partial_topics: report.pending_continuation.length,
      revision_entries: report.revision_classes,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-slate-500">Class</p>
        <p className="text-lg font-semibold text-slate-900">{report.class.display_name}</p>
        {report.subject && (
          <p className="mt-1 text-sm text-slate-700">Subject: {report.subject.name}</p>
        )}
        <p className="mt-1 text-sm text-slate-700">Month: {report.month}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Topics Taught" value={report.topics_taught_this_month} />
        <StatCard label="Completed" value={report.topics_completed_this_month} />
        <StatCard label="Revision Classes" value={report.revision_classes} />
        <StatCard label="Pending Continuation" value={report.pending_continuation.length} />
      </div>

      {report.pending_continuation.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pending Continuation Topics
          </h2>
          <ul className="space-y-3 text-sm text-slate-700">
            {report.pending_continuation.map((item, index) => (
              <li key={`${item.entry_date}-${index}`}>
                <p className="font-medium text-slate-900">
                  {formatDisplayDate(new Date(item.entry_date + "T00:00:00Z"))}
                  {item.topic_title ? ` · ${item.topic_title}` : ""}
                </p>
                <p className="mt-1">Taught: {item.topic_taught}</p>
                {item.next_class_plan && (
                  <p className="mt-1 text-slate-600">Next: {item.next_class_plan}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Teaching Diary This Month
        </h2>
        <TeachingDiaryReportView report={diaryReport} />
      </div>
    </div>
  );
}
