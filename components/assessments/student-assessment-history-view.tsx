"use client";

import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import Card from "@/components/ui/card";
import { StatCard } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import type { StudentAssessmentHistory } from "@/lib/types/assessment";

type StudentAssessmentHistoryViewProps = {
  history: StudentAssessmentHistory | null;
  loading?: boolean;
};

export default function StudentAssessmentHistoryView({
  history,
  loading = false,
}: StudentAssessmentHistoryViewProps) {
  if (loading) {
    return <p className="text-sm text-slate-600">Loading student history…</p>;
  }

  if (!history) {
    return (
      <p className="text-sm text-slate-600">Select a student to view marks history.</p>
    );
  }

  if (history.entries.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          No assessment marks recorded for {history.student_name} yet.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Assessments" value={history.entries.length} />
        <StatCard
          label="Average Score"
          value={
            history.average_percentage !== null
              ? `${history.average_percentage}%`
              : "—"
          }
        />
        <StatCard label="Roll No" value={history.roll_no} />
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Assessment</TableHeaderCell>
            <TableHeaderCell>Subject</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Marks</TableHeaderCell>
            <TableHeaderCell>%</TableHeaderCell>
            <TableHeaderCell>Remarks</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.entries.map((entry) => (
            <TableRow key={entry.assessment_id}>
              <TableCell>
                {formatDisplayDate(new Date(entry.assessment_date + "T00:00:00Z"))}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {entry.assessment_name}
              </TableCell>
              <TableCell>{entry.subject_name}</TableCell>
              <TableCell>{ASSESSMENT_TYPE_LABELS[entry.assessment_type]}</TableCell>
              <TableCell>
                {entry.marks_obtained !== null
                  ? `${entry.marks_obtained} / ${entry.max_marks}`
                  : "Absent"}
              </TableCell>
              <TableCell>
                {entry.percentage !== null ? `${entry.percentage}%` : "—"}
              </TableCell>
              <TableCell>{entry.remarks ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
