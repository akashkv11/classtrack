"use client";

import { useState } from "react";
import MonthlyReportTable from "@/components/reports/monthly-report-table";
import ReportPrintButton from "@/components/reports/report-print-button";
import Alert from "@/components/ui/alert";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState from "@/components/ui/loading-state";
import type { MonthlyReport } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type AttendanceReportClientProps = {
  classId: string;
};

export default function AttendanceReportClient({ classId }: AttendanceReportClientProps) {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    setError("");

    const reportRes = await fetch(
      `/api/reports/monthly?class_id=${classId}&month=${month}`,
      { signal },
    );

    if (!reportRes.ok) {
      const payload = await reportRes.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load report.");
      setReport(null);
      setLoading(false);
      return;
    }

    setReport(await reportRes.json());
    setLoading(false);
  }, [classId, month]);

  function handleMonthChange(value: string) {
    setMonth(value);
    const parsed = parseInput(monthSchema, value);
    setMonthError(parsed.success ? "" : parsed.error);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <FormField label="Month" error={monthError}>
          <TextInput
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            error={!!monthError}
          />
        </FormField>
        <ReportPrintButton />
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : report ? (
        <div id="report-content">
          <p className="mb-4 text-sm text-slate-600">
            Working days: <span className="font-medium">{report.working_days}</span>
          </p>
          <MonthlyReportTable students={report.students} />
        </div>
      ) : null}
    </>
  );
}
