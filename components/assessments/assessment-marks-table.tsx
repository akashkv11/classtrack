"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { inputClassName } from "@/lib/validation";
import type { AssessmentMarkRow } from "@/lib/types/assessment";

type AssessmentMarksTableProps = {
  records: AssessmentMarkRow[];
  maxMarks: number;
  onChange: (records: AssessmentMarkRow[]) => void;
  readOnly?: boolean;
};

function parseMarksInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.round(num) : null;
}

export default function AssessmentMarksTable({
  records,
  maxMarks,
  onChange,
  readOnly = false,
}: AssessmentMarksTableProps) {
  const [error, setError] = useState("");

  function updateRecord(
    studentId: string,
    field: "marks_obtained" | "remarks",
    value: string | number | null,
  ) {
    setError("");
    onChange(
      records.map((r) =>
        r.student_id === studentId ? { ...r, [field]: value } : r,
      ),
    );
  }

  function handleMarksChange(studentId: string, raw: string) {
    const marks = parseMarksInput(raw);
    if (marks !== null && (marks < 0 || marks > maxMarks)) {
      setError(`Marks must be between 0 and ${maxMarks}, or empty for absent`);
      return;
    }
    updateRecord(studentId, "marks_obtained", marks);
  }

  return (
    <div>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Roll</TableHeaderCell>
            <TableHeaderCell>Student Name</TableHeaderCell>
            <TableHeaderCell>Marks</TableHeaderCell>
            <TableHeaderCell>Remarks</TableHeaderCell>
            {!readOnly && <TableHeaderCell>Absent</TableHeaderCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.student_id}>
              <TableCell>{record.roll_no}</TableCell>
              <TableCell className="font-medium text-slate-900">
                {record.full_name}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  record.marks_obtained !== null ? (
                    record.marks_obtained
                  ) : (
                    <span className="text-slate-400">Absent</span>
                  )
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={maxMarks}
                    value={record.marks_obtained ?? ""}
                    onChange={(e) =>
                      handleMarksChange(record.student_id, e.target.value)
                    }
                    placeholder="—"
                    className={inputClassName(false, "w-20")}
                  />
                )}
              </TableCell>
              <TableCell>
                {readOnly ? (
                  (record.remarks ?? "—")
                ) : (
                  <input
                    type="text"
                    value={record.remarks ?? ""}
                    onChange={(e) =>
                      updateRecord(record.student_id, "remarks", e.target.value)
                    }
                    placeholder="Optional"
                    className={inputClassName(false, "w-full min-w-[120px]")}
                  />
                )}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateRecord(record.student_id, "marks_obtained", null)
                    }
                  >
                    Mark absent
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
