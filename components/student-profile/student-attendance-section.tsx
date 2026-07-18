"use client";

import Link from "next/link";
import { useState } from "react";
import Alert from "@/components/ui/alert";
import Badge from "@/components/ui/badge";
import Card, { StatCard } from "@/components/ui/card";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/dates";
import type { StudentMonthlyAttendance } from "@/lib/types/student-profile";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

type StudentAttendanceSectionProps = {
  classId: string;
  studentId: string;
  initialAttendance: StudentMonthlyAttendance;
};

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    date,
  );
}

function statusBadge(status: StudentMonthlyAttendance["records"][number]["status"]) {
  switch (status) {
    case "present":
      return <Badge variant="success">Present</Badge>;
    case "absent":
      return <Badge variant="warning">Absent</Badge>;
    case "late":
      return <Badge variant="info">Late</Badge>;
    default:
      return <Badge variant="neutral">Not marked</Badge>;
  }
}

export default function StudentAttendanceSection({
  classId,
  studentId,
  initialAttendance,
}: StudentAttendanceSectionProps) {
  const [month, setMonth] = useState(initialAttendance.month);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [monthError, setMonthError] = useState("");

  useClientEffect(async (signal) => {
    const monthParsed = parseInput(monthSchema, month);
    if (!monthParsed.success) {
      setMonthError(monthParsed.error);
      setLoading(false);
      return;
    }

    setMonthError("");

    if (month === initialAttendance.month) {
      setAttendance(initialAttendance);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(
      `/api/classes/${classId}/students/${studentId}/attendance?month=${month}`,
      { signal },
    );

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load attendance.");
      setLoading(false);
      return;
    }

    setAttendance(await res.json());
    setLoading(false);
  }, [classId, studentId, month, initialAttendance.month]);

  const monthLabel = formatMonthLabel(attendance.month);

  return (
    <Card className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Attendance</h3>
          <p className="mt-1 text-sm text-slate-600">{monthLabel}</p>
        </div>
        <FormField label="Month" error={monthError}>
          <TextInput
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            error={!!monthError}
          />
        </FormField>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState message="Loading attendance..." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Present" value={attendance.present_days} />
            <StatCard label="Absent" value={attendance.absent_days} />
            <StatCard label="Late" value={attendance.late_days} />
            <StatCard label="Sessions" value={attendance.working_days} />
            <StatCard
              label="Attendance %"
              value={`${attendance.attendance_percentage}%`}
            />
          </div>

          {attendance.records.length === 0 ? (
            <EmptyState message="No attendance recorded for this month yet." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Subject / Period</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Remarks</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.records.map((row) => (
                  <TableRow key={row.session_id}>
                    <TableCell>
                      <Link
                        href={`/classes/${classId}/summary/${row.session_id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {formatDisplayDate(new Date(row.attendance_date + "T00:00:00Z"))}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        {row.subject ?? "Class session"}
                        {row.class_time && (
                          <p className="text-xs text-slate-500">{row.class_time}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                    <TableCell>{row.remarks ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Card>
  );
}
