import Card, { StatCard } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import type { TeachingDiaryReport } from "@/lib/types/report";

type TeachingDiaryReportViewProps = {
  report: TeachingDiaryReport;
};

export default function TeachingDiaryReportView({ report }: TeachingDiaryReportViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-slate-500">Class</p>
        <p className="text-lg font-semibold text-slate-900">{report.class.display_name}</p>
        {report.subject && (
          <p className="mt-1 text-sm text-slate-700">Subject: {report.subject.name}</p>
        )}
        {report.month && (
          <p className="mt-1 text-sm text-slate-700">Month: {report.month}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Entries" value={report.summary.total_entries} />
        <StatCard label="Topics Taught" value={report.summary.topics_taught} />
        <StatCard label="Partial Topics" value={report.summary.partial_topics} />
        <StatCard label="Revision" value={report.summary.revision_entries} />
      </div>

      {report.entries.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">No teaching diary entries found for this period.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {report.entries.map((entry, index) => (
            <Card key={`${entry.entry_date}-${index}`}>
              <p className="text-sm font-medium text-slate-500">
                {formatDisplayDate(new Date(entry.entry_date + "T00:00:00Z"))}
                {entry.subject ? ` · ${entry.subject}` : ""}
              </p>
              {entry.chapter && (
                <p className="mt-1 font-semibold text-slate-900">{entry.chapter}</p>
              )}
              {entry.topic && (
                <p className="text-sm text-slate-700">Topic: {entry.topic}</p>
              )}
              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-800">Taught: </span>
                  {entry.topic_taught}
                </p>
                {entry.teaching_notes && (
                  <p>
                    <span className="font-medium text-slate-800">Notes: </span>
                    {entry.teaching_notes}
                  </p>
                )}
                {entry.next_class_plan && (
                  <p>
                    <span className="font-medium text-slate-800">Next class: </span>
                    {entry.next_class_plan}
                  </p>
                )}
                <p>
                  <span className="font-medium text-slate-800">Status: </span>
                  {entry.diary_status}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
