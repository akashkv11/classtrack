"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AssessmentCard from "@/components/assessments/assessment-card";
import AssessmentForm from "@/components/assessments/assessment-form";
import StudentAssessmentHistoryView from "@/components/assessments/student-assessment-history-view";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import FormField, { SelectInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/loading-state";
import { ASSESSMENT_TYPE_LABELS, ASSESSMENT_TYPES } from "@/lib/assessments/types";
import type {
  AssessmentListResponse,
  AssessmentSummary,
  StudentAssessmentHistory,
} from "@/lib/types/assessment";
import type { SyllabusSubjectSummary } from "@/lib/types/syllabus";
import type { Student } from "@/lib/types/student";

type AssessmentsPageClientProps = {
  classId: string;
  initialSubjects: SyllabusSubjectSummary[];
  initialData: AssessmentListResponse;
  students: Student[];
};

export default function AssessmentsPageClient({
  classId,
  initialSubjects,
  initialData,
  students,
}: AssessmentsPageClientProps) {
  const router = useRouter();
  const [assessments, setAssessments] = useState(initialData.assessments);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentSummary | null>(
    null,
  );
  const [deletingAssessment, setDeletingAssessment] =
    useState<AssessmentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentHistory, setStudentHistory] = useState<StudentAssessmentHistory | null>(
    null,
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  const refreshAssessments = useCallback(async () => {
    const params = new URLSearchParams();
    if (subjectFilter) params.set("subject_id", subjectFilter);
    if (typeFilter) params.set("assessment_type", typeFilter);

    const res = await fetch(`/api/classes/${classId}/assessments?${params.toString()}`);
    if (!res.ok) return;
    const data: AssessmentListResponse = await res.json();
    setAssessments(data.assessments);
  }, [classId, subjectFilter, typeFilter]);

  async function handleFilterChange() {
    await refreshAssessments();
  }

  async function handleSaved(assessmentId: string) {
    await refreshAssessments();
    router.refresh();
    if (!editingAssessment) {
      router.push(`/classes/${classId}/assessments/${assessmentId}`);
    }
  }

  async function handleDelete() {
    if (!deletingAssessment) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/assessments/${deletingAssessment.id}?class_id=${classId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete assessment");
      }
      setDeletingAssessment(null);
      await refreshAssessments();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assessment");
    } finally {
      setDeleting(false);
    }
  }

  async function loadStudentHistory(studentId: string) {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setStudentHistory(null);
      return;
    }

    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/classes/${classId}/assessments?student_id=${studentId}`,
      );
      if (!res.ok) {
        setStudentHistory(null);
        return;
      }
      const data: StudentAssessmentHistory = await res.json();
      setStudentHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  }

  const hasSubjects = initialSubjects.length > 0;

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <ActionBar className="mb-8">
        <Button
          className={actionButtonClassName}
          onClick={() => {
            setEditingAssessment(null);
            setShowForm(true);
          }}
          disabled={!hasSubjects}
        >
          Create Assessment
        </Button>
      </ActionBar>

      {!hasSubjects && (
        <Alert variant="warning" className="mb-6">
          Add syllabus subjects for this class before creating assessments.
        </Alert>
      )}

      <Card className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Subject">
            <SelectInput
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">All subjects</option>
              {initialSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_name}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Assessment Type">
            <SelectInput value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {ASSESSMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ASSESSMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <Button variant="secondary" size="sm" className="mt-4" onClick={handleFilterChange}>
          Apply Filters
        </Button>
      </Card>

      {assessments.length === 0 ? (
        <EmptyState message="No assessments yet. Create your first assessment to start recording marks for this class." />
      ) : (
        <div className="mb-12">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              classId={classId}
              assessment={assessment}
              onEdit={(a) => {
                setEditingAssessment(a);
                setShowForm(true);
              }}
              onDelete={setDeletingAssessment}
            />
          ))}
        </div>
      )}

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Student Marks History</h2>
        <FormField label="Select Student">
          <SelectInput
            value={selectedStudentId}
            onChange={(e) => loadStudentHistory(e.target.value)}
          >
            <option value="">Choose a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.roll_no}. {s.full_name}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <div className="mt-6">
          <StudentAssessmentHistoryView
            history={studentHistory}
            loading={historyLoading}
          />
        </div>
      </Card>

      <AssessmentForm
        open={showForm}
        classId={classId}
        subjects={initialSubjects}
        assessment={editingAssessment}
        onClose={() => {
          setShowForm(false);
          setEditingAssessment(null);
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingAssessment)}
        title="Delete assessment?"
        description={`This will permanently delete "${deletingAssessment?.name}" and all marks entered for it.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAssessment(null)}
      />
    </>
  );
}
