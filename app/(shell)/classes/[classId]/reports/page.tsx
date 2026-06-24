"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useClass } from "@/components/classes/class-provider";
import MonthlyReportTable from "@/components/reports/monthly-report-table";
import Alert from "@/components/ui/alert";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import type { MonthlyReport } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyReportPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const { displayName } = useClass();

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

    const reportRes = await fetch(`/api/reports/monthly?class_id=${classId}&month=${month}`, {
      signal,
    });

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
    <PageContainer>
      <PageHeader
        title="Monthly Report"
        subtitle={displayName}
        backHref={`/classes/${classId}`}
      />

      <div className="mb-6">
        <FormField label="Month" error={monthError}>
          <TextInput
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            error={!!monthError}
          />
        </FormField>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingState />
      ) : report ? (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Working days: <span className="font-medium">{report.working_days}</span>
          </p>
          <MonthlyReportTable students={report.students} />
        </>
      ) : null}
    </PageContainer>
  );
}
