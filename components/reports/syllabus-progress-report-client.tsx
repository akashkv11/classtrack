"use client";

import { useState } from "react";
import ReportPrintButton from "@/components/reports/report-print-button";
import ReportSubjectFilter from "@/components/reports/report-subject-filter";
import SyllabusProgressReportView from "@/components/reports/syllabus-progress-report-view";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/ui/loading-state";
import type { SyllabusProgressReport } from "@/lib/types/report";
import type { SyllabusSubjectSummary } from "@/lib/types/syllabus";
import { useClientEffect } from "@/lib/use-client-effect";

type SyllabusProgressReportClientProps = {
  classId: string;
  subjects: SyllabusSubjectSummary[];
};

export default function SyllabusProgressReportClient({
  classId,
  subjects,
}: SyllabusProgressReportClientProps) {
  const defaultSubject = subjects.length === 1 ? subjects[0].id : "";
  const [subjectId, setSubjectId] = useState(defaultSubject);
  const [report, setReport] = useState<SyllabusProgressReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport(signal?: AbortSignal) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (subjectId) params.set("subject_id", subjectId);

    const res = await fetch(
      `/api/classes/${classId}/reports/syllabus-progress?${params.toString()}`,
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
  }

  useClientEffect((signal) => loadReport(signal), [classId, subjectId]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <ReportSubjectFilter
            subjects={subjects}
            value={subjectId}
            onChange={setSubjectId}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => loadReport()}>
            Apply
          </Button>
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
          <SyllabusProgressReportView report={report} />
        </div>
      ) : null}
    </>
  );
}
