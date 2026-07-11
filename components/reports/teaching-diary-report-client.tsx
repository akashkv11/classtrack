"use client";

import { useState } from "react";
import ReportPrintButton from "@/components/reports/report-print-button";
import ReportSubjectFilter from "@/components/reports/report-subject-filter";
import TeachingDiaryReportView from "@/components/reports/teaching-diary-report-view";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState from "@/components/ui/loading-state";
import type { TeachingDiaryReport } from "@/lib/types/report";
import type { SyllabusSubjectSummary } from "@/lib/types/syllabus";
import { useClientEffect } from "@/lib/use-client-effect";
import { monthSchema, parseInput } from "@/lib/validation";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type TeachingDiaryReportClientProps = {
  classId: string;
  subjects: SyllabusSubjectSummary[];
};

export default function TeachingDiaryReportClient({
  classId,
  subjects,
}: TeachingDiaryReportClientProps) {
  const [month, setMonth] = useState(currentMonth());
  const [subjectId, setSubjectId] = useState("");
  const [report, setReport] = useState<TeachingDiaryReport | null>(null);
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
      `/api/classes/${classId}/reports/teaching-diary?${params.toString()}`,
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
          <TeachingDiaryReportView report={report} />
        </div>
      ) : null}
    </>
  );
}
