"use client";

import { useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import type { SyllabusChapterSummary } from "@/lib/types/syllabus";
import {
  FieldErrors,
  inputClassName,
  parseInput,
  syllabusChapterCreateSchema,
  syllabusChapterUpdateSchema,
} from "@/lib/validation";

type ChapterFormProps = {
  open: boolean;
  classId: string;
  subjectId: string;
  chapter?: SyllabusChapterSummary | null;
  onClose: () => void;
  onSaved: () => void;
};

type ChapterFormDialogProps = Omit<ChapterFormProps, "open">;

function ChapterFormDialog({
  classId,
  subjectId,
  chapter,
  onClose,
  onSaved,
}: ChapterFormDialogProps) {
  const isEdit = Boolean(chapter);
  const [chapterNumber, setChapterNumber] = useState(() =>
    chapter?.chapter_number ? String(chapter.chapter_number) : "",
  );
  const [chapterTitle, setChapterTitle] = useState(() => chapter?.chapter_title ?? "");
  const [chapterSummary, setChapterSummary] = useState(
    () => chapter?.chapter_summary ?? "",
  );
  const [displayOrder, setDisplayOrder] = useState(() =>
    chapter ? String(chapter.display_order) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const payload = {
      chapter_number: chapterNumber || undefined,
      chapter_title: chapterTitle,
      chapter_summary: chapterSummary || undefined,
      display_order: displayOrder || undefined,
    };

    const parsed = isEdit
      ? parseInput(syllabusChapterUpdateSchema, {
          ...payload,
          chapter_summary: chapterSummary.trim() ? chapterSummary : null,
        })
      : parseInput(syllabusChapterCreateSchema, payload);

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `/api/syllabus/chapters/${chapter!.id}?class_id=${classId}`
        : `/api/syllabus/${subjectId}/chapters?class_id=${classId}`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save chapter");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save chapter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      title={isEdit ? "Edit Chapter" : "Add Chapter"}
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="chapter-form" variant="primary" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Save Chapter"}
          </Button>
        </div>
      }
    >
      <form id="chapter-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="Chapter Number" error={fieldErrors.chapter_number}>
          <TextInput
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => setChapterNumber(e.target.value)}
            error={!!fieldErrors.chapter_number}
          />
        </FormField>
        <FormField label="Chapter Title" error={fieldErrors.chapter_title}>
          <TextInput
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            error={!!fieldErrors.chapter_title}
          />
        </FormField>
        <FormField label="Chapter Summary" error={fieldErrors.chapter_summary}>
          <textarea
            className={inputClassName(!!fieldErrors.chapter_summary)}
            rows={3}
            value={chapterSummary}
            onChange={(e) => setChapterSummary(e.target.value)}
          />
        </FormField>
        <FormField label="Display Order" error={fieldErrors.display_order}>
          <TextInput
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            error={!!fieldErrors.display_order}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default function ChapterForm({
  open,
  classId,
  subjectId,
  chapter,
  onClose,
  onSaved,
}: ChapterFormProps) {
  if (!open) return null;

  const dialogKey = chapter?.id ?? "new-chapter";

  return (
    <ChapterFormDialog
      key={dialogKey}
      classId={classId}
      subjectId={subjectId}
      chapter={chapter}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
