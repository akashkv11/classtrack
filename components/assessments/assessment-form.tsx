"use client";

import { useEffect, useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import { todayISO } from "@/lib/dates";
import { ASSESSMENT_TYPE_LABELS, ASSESSMENT_TYPES } from "@/lib/assessments/types";
import {
  FieldErrors,
  assessmentCreateSchema,
  assessmentUpdateSchema,
  parseInput,
} from "@/lib/validation";
import type { AssessmentSummary, AssessmentType } from "@/lib/types/assessment";
import type { SyllabusSubjectDetail, SyllabusSubjectSummary } from "@/lib/types/syllabus";

type AssessmentFormProps = {
  open: boolean;
  classId: string;
  subjects: SyllabusSubjectSummary[];
  assessment?: AssessmentSummary | null;
  onClose: () => void;
  onSaved: (assessmentId: string) => void;
};

function chapterLabel(ch: { chapter_number: number | null; chapter_title: string }) {
  return ch.chapter_number
    ? `Chapter ${ch.chapter_number}: ${ch.chapter_title}`
    : ch.chapter_title;
}

export default function AssessmentForm({
  open,
  classId,
  subjects,
  assessment,
  onClose,
  onSaved,
}: AssessmentFormProps) {
  const isEdit = Boolean(assessment);

  const [name, setName] = useState(() => assessment?.name ?? "");
  const [subjectId, setSubjectId] = useState(() => assessment?.subject.id ?? "");
  const [chapterId, setChapterId] = useState(() => assessment?.chapter?.id ?? "");
  const [topicIds, setTopicIds] = useState<string[]>(
    () => assessment?.topics.map((t) => t.id) ?? [],
  );
  const [subjectDetail, setSubjectDetail] = useState<SyllabusSubjectDetail | null>(null);
  const [loadedSubjectId, setLoadedSubjectId] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(
    () => assessment?.assessment_type ?? "CLASS_TEST",
  );
  const [assessmentDate, setAssessmentDate] = useState(
    () => assessment?.assessment_date ?? todayISO(),
  );
  const [maxMarks, setMaxMarks] = useState(() =>
    assessment ? String(assessment.max_marks) : "25",
  );
  const [remarks, setRemarks] = useState(() => assessment?.remarks ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open || !subjectId) return;

    let cancelled = false;
    async function loadSubject() {
      const res = await fetch(`/api/classes/${classId}/syllabus/${subjectId}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setSubjectDetail(data.subject);
      setLoadedSubjectId(subjectId);
    }

    loadSubject();
    return () => {
      cancelled = true;
    };
  }, [open, classId, subjectId]);

  function toggleTopic(id: string) {
    setTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const payload = {
      name,
      syllabus_subject_id: subjectId,
      syllabus_chapter_id: chapterId || null,
      syllabus_topic_ids: topicIds,
      assessment_type: assessmentType,
      assessment_date: assessmentDate,
      max_marks: Number(maxMarks),
      remarks: remarks || null,
    };

    const parsed = isEdit
      ? parseInput(assessmentUpdateSchema, payload)
      : parseInput(assessmentCreateSchema, payload);

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const url = isEdit
        ? `/api/assessments/${assessment!.id}?class_id=${classId}`
        : `/api/classes/${classId}/assessments`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save assessment");
      }

      const body = await res.json();
      onSaved(body.assessment?.id ?? assessment!.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  }

  const chapters =
    loadedSubjectId === subjectId ? (subjectDetail?.chapters ?? []) : [];
  const topics =
    chapters.find((ch) => ch.id === chapterId)?.topics ??
    chapters.flatMap((ch) => ch.topics);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Assessment" : "Create Assessment"}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <FormField label="Assessment Name" error={fieldErrors.name}>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Unit Test 1"
              error={!!fieldErrors.name}
            />
          </FormField>

          <FormField label="Subject" error={fieldErrors.syllabus_subject_id}>
            <SelectInput
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setChapterId("");
                setTopicIds([]);
                setSubjectDetail(null);
                setLoadedSubjectId(null);
              }}
              error={!!fieldErrors.syllabus_subject_id}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_name}
                </option>
              ))}
            </SelectInput>
          </FormField>

          {subjectId && chapters.length > 0 && (
            <FormField label="Chapter (optional)" error={fieldErrors.syllabus_chapter_id}>
              <SelectInput
                value={chapterId}
                onChange={(e) => {
                  setChapterId(e.target.value);
                  setTopicIds([]);
                }}
              >
                <option value="">All chapters</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {chapterLabel(ch)}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          {subjectId && topics.length > 0 && (
            <FormField label="Linked Topics (optional)">
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {topics.map((topic) => (
                  <label
                    key={topic.id}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={topicIds.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="mt-0.5"
                    />
                    <span>{topic.topic_title}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Type" error={fieldErrors.assessment_type}>
              <SelectInput
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
              >
                {ASSESSMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ASSESSMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Date" error={fieldErrors.assessment_date}>
              <TextInput
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                error={!!fieldErrors.assessment_date}
              />
            </FormField>
          </div>

          <FormField label="Max Marks" error={fieldErrors.max_marks}>
            <TextInput
              type="number"
              min={1}
              max={1000}
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              error={!!fieldErrors.max_marks}
            />
          </FormField>

          <FormField label="Remarks (optional)" error={fieldErrors.remarks}>
            <TextInput
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes about this assessment"
            />
          </FormField>
        </div>

        <div className={modalFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Assessment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
