"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AssessmentMarksTable from "@/components/assessments/assessment-marks-table";
import AssessmentSummaryCards from "@/components/assessments/assessment-summary-cards";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import Alert from "@/components/ui/alert";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/dates";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import type {
  AssessmentMarkRow,
  AssessmentMarksResponse,
} from "@/lib/types/assessment";

type AssessmentDetailClientProps = {
  classId: string;
  assessmentId: string;
  initialData: AssessmentMarksResponse;
};

export default function AssessmentDetailClient({
  classId,
  assessmentId,
  initialData,
}: AssessmentDetailClientProps) {
  const router = useRouter();
  const [records, setRecords] = useState<AssessmentMarkRow[]>(initialData.records);
  const [summary, setSummary] = useState(initialData.summary);
  const [savedRecords, setSavedRecords] = useState<AssessmentMarkRow[]>(initialData.records);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const assessment = initialData.assessment;
  const maxMarks = assessment.max_marks;

  const hasChanges = useMemo(() => {
    return JSON.stringify(records) !== JSON.stringify(savedRecords);
  }, [records, savedRecords]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        `/api/assessments/${assessmentId}/marks?class_id=${classId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records: records.map((r) => ({
              student_id: r.student_id,
              marks_obtained: r.marks_obtained,
              remarks: r.remarks || null,
            })),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save marks");
      }

      const data = await res.json();
      setRecords(data.records);
      setSavedRecords(data.records);
      setSummary(data.summary);
      setSuccess("Marks saved successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save marks");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="info" className="mb-6 border-green-200 bg-green-50 text-green-800">
          {success}
        </Alert>
      )}

      <Card className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{assessment.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {formatDisplayDate(new Date(assessment.assessment_date + "T00:00:00Z"))}
              {" · "}
              {assessment.subject.name}
              {" · "}
              Max marks: {maxMarks}
            </p>
            {assessment.chapter && (
              <p className="mt-1 text-sm text-slate-600">
                Chapter: {assessment.chapter.chapter_title}
              </p>
            )}
            {assessment.topics.length > 0 && (
              <p className="mt-1 text-sm text-slate-600">
                Topics: {assessment.topics.map((t) => t.topic_title).join(", ")}
              </p>
            )}
            {assessment.remarks && (
              <p className="mt-1 text-sm text-slate-600">Remarks: {assessment.remarks}</p>
            )}
          </div>
          <Badge variant="info">
            {ASSESSMENT_TYPE_LABELS[assessment.assessment_type]}
          </Badge>
        </div>
      </Card>

      <h3 className="mb-4 text-lg font-semibold text-slate-900">Assessment Summary</h3>
      <AssessmentSummaryCards summary={summary} maxMarks={maxMarks} />

      <h3 className="mb-4 text-lg font-semibold text-slate-900">Enter Marks</h3>

      {records.length === 0 ? (
        <Alert variant="warning">
          No active students in this class. Add students before entering marks.
        </Alert>
      ) : (
        <>
          <AssessmentMarksTable
            records={records}
            maxMarks={maxMarks}
            onChange={setRecords}
          />

          <ActionBar className="mt-6">
            <Button
              className={actionButtonClassName}
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving…" : "Save Marks"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRecords(savedRecords)}
              disabled={saving}
            >
              Reset
            </Button>
          </ActionBar>
        </>
      )}
    </>
  );
}
