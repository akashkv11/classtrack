"use client";

import { useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import {
  FieldErrors,
  parseInput,
  syllabusSubjectUpdateSchema,
} from "@/lib/validation";

type SubjectFormValues = {
  subject_name: string;
  stream: string;
  textbook_name: string;
  board: string;
  academic_year: string;
};

type EditSubjectFormProps = {
  open: boolean;
  classId: string;
  subjectId: string;
  initial: SubjectFormValues;
  onClose: () => void;
  onSaved: () => void;
};

type EditSubjectFormDialogProps = Omit<EditSubjectFormProps, "open">;

function EditSubjectFormDialog({
  classId,
  subjectId,
  initial,
  onClose,
  onSaved,
}: EditSubjectFormDialogProps) {
  const [subjectName, setSubjectName] = useState(() => initial.subject_name);
  const [stream, setStream] = useState(() => initial.stream);
  const [textbookName, setTextbookName] = useState(() => initial.textbook_name);
  const [board, setBoard] = useState(() => initial.board);
  const [academicYear, setAcademicYear] = useState(() => initial.academic_year);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = parseInput(syllabusSubjectUpdateSchema, {
      subject_name: subjectName,
      stream: stream || null,
      textbook_name: textbookName || null,
      board: board || null,
      academic_year: academicYear || null,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/syllabus/${subjectId}?class_id=${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update subject");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subject");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      title="Edit Syllabus Subject"
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-subject-form" variant="primary" disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      }
    >
      <form id="edit-subject-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="Subject Name" error={fieldErrors.subject_name}>
          <TextInput
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            error={!!fieldErrors.subject_name}
          />
        </FormField>
        <FormField label="Stream" error={fieldErrors.stream}>
          <TextInput value={stream} onChange={(e) => setStream(e.target.value)} />
        </FormField>
        <FormField label="Textbook" error={fieldErrors.textbook_name}>
          <TextInput
            value={textbookName}
            onChange={(e) => setTextbookName(e.target.value)}
          />
        </FormField>
        <FormField label="Board" error={fieldErrors.board}>
          <TextInput value={board} onChange={(e) => setBoard(e.target.value)} />
        </FormField>
        <FormField label="Academic Year" error={fieldErrors.academic_year}>
          <TextInput
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default function EditSubjectForm({
  open,
  classId,
  subjectId,
  initial,
  onClose,
  onSaved,
}: EditSubjectFormProps) {
  if (!open) return null;

  return (
    <EditSubjectFormDialog
      key={subjectId}
      classId={classId}
      subjectId={subjectId}
      initial={initial}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
