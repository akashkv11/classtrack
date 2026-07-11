import Link from "next/link";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import { formatDisplayDate } from "@/lib/dates";
import type { AssessmentType } from "@/lib/types/assessment";
import type { AssessmentsReport } from "@/lib/types/report";

type AssessmentsReportViewProps = {
  report: AssessmentsReport;
  classId: string;
  showMarkSheetLinks?: boolean;
};

export default function AssessmentsReportView({
  report,
  classId,
  showMarkSheetLinks = true,
}: AssessmentsReportViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Class: <span className="font-medium text-slate-900">{report.class.display_name}</span>
          {report.month && (
            <>
              {" "}
              · Month: <span className="font-medium text-slate-900">{report.month}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Low marks threshold: {report.low_marks_threshold_percent}%
        </p>
      </div>

      {report.assessments.length === 0 ? (
        <p className="text-sm text-slate-600">No assessments found for the selected period.</p>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Assessment</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Average</TableHeaderCell>
              <TableHeaderCell>Below {report.low_marks_threshold_percent}%</TableHeaderCell>
              {showMarkSheetLinks && <TableHeaderCell>Mark Sheet</TableHeaderCell>}
            </tr>
          </TableHead>
          <TableBody>
            {report.assessments.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {formatDisplayDate(new Date(row.assessment_date + "T00:00:00Z"))}
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  {ASSESSMENT_TYPE_LABELS[row.assessment_type as AssessmentType] ??
                    row.assessment_type}
                </TableCell>
                <TableCell>{row.subject_name}</TableCell>
                <TableCell>
                  {row.class_average !== null
                    ? `${row.class_average} / ${row.max_marks}`
                    : "—"}
                </TableCell>
                <TableCell>{row.below_threshold_count}</TableCell>
                {showMarkSheetLinks && (
                  <TableCell className="print:hidden">
                    <Link
                      href={`/classes/${classId}/reports/assessments/${row.id}`}
                      className="font-medium text-blue-700 hover:text-blue-800"
                    >
                      View / Print
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
