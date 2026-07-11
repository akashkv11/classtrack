"use client";

import { useState } from "react";
import AssessmentsReportView from "@/components/reports/assessments-report-view";
import ReportHeader, { ReportFooter } from "@/components/reports/report-header";
import ReportPrintActions from "@/components/reports/report-print-actions";
import Alert from "@/components/ui/alert";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState from "@/components/ui/loading-state";
import type { AssessmentsReport } from "@/lib/types/report";
import type { ReportSettings } from "@/lib/types/settings";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type AssessmentsReportClientProps = {
  classId: string;
  reportSettings: ReportSettings;
};

export default function AssessmentsReportClient({
  classId,
  reportSettings,
}: AssessmentsReportClientProps) {
  const [month, setMonth] = useState(currentMonth());
  const [allMonths, setAllMonths] = useState(false);
  const [report, setReport] = useState<AssessmentsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthError, setMonthError] = useState("");

  useClientEffect(async (signal) => {
    if (!allMonths) {
      const monthParsed = parseInput(monthSchema, month);
      if (!monthParsed.success) {
        setMonthError(monthParsed.error);
        setLoading(false);
        return;
      }
      setMonthError("");
    } else {
      setMonthError("");
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (!allMonths) params.set("month", month);

    const res = await fetch(
      `/api/classes/${classId}/reports/assessments?${params.toString()}`,
      { signal },
    );

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load report.");
      setReport(null);
      setLoading(false);
      return;
    }

    setReport(await res.json());
    setLoading(false);
  }, [classId, month, allMonths]);

  const subtitle = report
    ? `${report.class.display_name}${report.month ? ` · ${report.month}` : " · All assessments"}`
    : undefined;

  return (
    <>
      <div className="mb-6 space-y-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <FormField label="Month" error={monthError}>
            <TextInput
              type="month"
              value={month}
              disabled={allMonths}
              onChange={(e) => {
                setMonth(e.target.value);
                const parsed = parseInput(monthSchema, e.target.value);
                setMonthError(parsed.success ? "" : parsed.error);
              }}
              error={!!monthError}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allMonths}
              onChange={(e) => setAllMonths(e.target.checked)}
            />
            Show all assessments
          </label>
        </div>
        <ReportPrintActions disabled={!report || loading} />
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
          <ReportHeader
            settings={reportSettings}
            title="Assessment / Marks Report"
            subtitle={subtitle}
          />
          <AssessmentsReportView report={report} classId={classId} />
          <ReportFooter settings={reportSettings} />
        </div>
      ) : null}
    </>
  );
}
