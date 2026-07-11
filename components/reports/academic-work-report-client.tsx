"use client";

import { useState } from "react";
import AcademicWorkReportView from "@/components/reports/academic-work-report-view";
import ReportHeader, { ReportFooter } from "@/components/reports/report-header";
import ReportPrintActions from "@/components/reports/report-print-actions";
import ReportSubjectFilter from "@/components/reports/report-subject-filter";
import Alert from "@/components/ui/alert";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState from "@/components/ui/loading-state";
import type { MonthlyAcademicWorkReport } from "@/lib/types/report";
import type { SyllabusSubjectSummary } from "@/lib/types/syllabus";
import type { ReportSettings } from "@/lib/types/settings";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type AcademicWorkReportClientProps = {
  classId: string;
  subjects: SyllabusSubjectSummary[];
  reportSettings: ReportSettings;
};

export default function AcademicWorkReportClient({
  classId,
  subjects,
  reportSettings,
}: AcademicWorkReportClientProps) {
  const [month, setMonth] = useState(currentMonth());
  const [subjectId, setSubjectId] = useState("");
  const [report, setReport] = useState<MonthlyAcademicWorkReport | null>(null);
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

    const params = new URLSearchParams({ month });
    if (subjectId) params.set("subject_id", subjectId);

    const res = await fetch(
      `/api/classes/${classId}/reports/academic-work?${params.toString()}`,
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
  }, [classId, month, subjectId]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Month" error={monthError}>
            <TextInput
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                const parsed = parseInput(monthSchema, e.target.value);
                setMonthError(parsed.success ? "" : parsed.error);
              }}
              error={!!monthError}
            />
          </FormField>
          <ReportSubjectFilter
            subjects={subjects}
            value={subjectId}
            onChange={setSubjectId}
          />
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
            title="Monthly Academic Work Report"
            subtitle={[
              report.class.display_name,
              report.subject ? `Subject: ${report.subject.name}` : null,
              `Month: ${report.month}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
          <AcademicWorkReportView report={report} />
          <ReportFooter settings={reportSettings} />
        </div>
      ) : null}
    </>
  );
}
