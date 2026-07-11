import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/card";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import { formatDisplayDate } from "@/lib/dates";
import type { AssessmentMarksResponse } from "@/lib/types/assessment";

type AssessmentMarkSheetViewProps = {
  data: AssessmentMarksResponse;
  lowMarksThresholdPercent: number;
};

export default function AssessmentMarkSheetView({
  data,
  lowMarksThresholdPercent,
}: AssessmentMarkSheetViewProps) {
  const { assessment, records, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-semibold text-slate-900">{assessment.name}</p>
        <p className="mt-1 text-sm text-slate-600">
          {formatDisplayDate(new Date(assessment.assessment_date + "T00:00:00Z"))}
          {" · "}
          {ASSESSMENT_TYPE_LABELS[assessment.assessment_type]}
          {" · "}
          {assessment.subject.name}
          {" · "}
          Max marks: {assessment.max_marks}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Class Average"
          value={
            summary.class_average !== null
              ? `${summary.class_average} / ${assessment.max_marks}`
              : "—"
          }
        />
        <StatCard label="Highest" value={summary.highest ?? "—"} />
        <StatCard label="Lowest" value={summary.lowest ?? "—"} />
        <StatCard
          label={`Below ${lowMarksThresholdPercent}%`}
          value={summary.below_40_percent_count}
        />
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Roll</TableHeaderCell>
            <TableHeaderCell>Student</TableHeaderCell>
            <TableHeaderCell>Marks</TableHeaderCell>
            <TableHeaderCell>Remarks</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {records.map((row) => (
            <TableRow key={row.student_id}>
              <TableCell>{row.roll_no}</TableCell>
              <TableCell>{row.full_name}</TableCell>
              <TableCell className="font-medium">
                {row.marks_obtained !== null ? row.marks_obtained : "Absent"}
              </TableCell>
              <TableCell>{row.remarks ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
