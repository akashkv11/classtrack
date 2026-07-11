"use client";

import { useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { CheckboxField, SelectInput, TextInput } from "@/components/ui/form-field";
import { todayISO } from "@/lib/dates";
import {
  NOTE_CATEGORIES,
  NOTE_CATEGORY_LABELS,
  NOTE_STATUS_LABELS,
} from "@/lib/student-notes/status";
import {
  FieldErrors,
  parseInput,
  studentNoteCreateSchema,
  studentNoteUpdateSchema,
} from "@/lib/validation";
import type { NoteCategory, NoteStatus, StudentNoteSummary } from "@/lib/types/student-note";

type StudentNoteFormProps = {
  open: boolean;
  note?: StudentNoteSummary | null;
  onClose: () => void;
  onSave: (data: {
    note_date: string;
    category: NoteCategory;
    note_text: string;
    follow_up_needed: boolean;
    follow_up_date: string | null;
    status: NoteStatus;
  }) => Promise<void>;
};

export default function StudentNoteForm({
  open,
  note,
  onClose,
  onSave,
}: StudentNoteFormProps) {
  const isEdit = Boolean(note);

  const [noteDate, setNoteDate] = useState(() => note?.note_date ?? todayISO());
  const [category, setCategory] = useState<NoteCategory>(
    () => note?.category ?? "ACADEMIC",
  );
  const [noteText, setNoteText] = useState(() => note?.note_text ?? "");
  const [followUpNeeded, setFollowUpNeeded] = useState(
    () => note?.follow_up_needed ?? false,
  );
  const [followUpDate, setFollowUpDate] = useState(
    () => note?.follow_up_date ?? "",
  );
  const [status, setStatus] = useState<NoteStatus>(() => note?.status ?? "OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const payload = {
      note_date: noteDate,
      category,
      note_text: noteText,
      follow_up_needed: followUpNeeded,
      follow_up_date: followUpNeeded ? followUpDate || null : null,
      status,
    };

    const parsed = isEdit
      ? parseInput(studentNoteUpdateSchema, payload)
      : parseInput(studentNoteCreateSchema, payload);

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      setLoading(false);
      return;
    }

    try {
      await onSave({
        note_date: noteDate,
        category,
        note_text: noteText,
        follow_up_needed: followUpNeeded,
        follow_up_date: followUpNeeded ? followUpDate || null : null,
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Student Note" : "Add Student Note"}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" error={fieldErrors.note_date}>
              <TextInput
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                error={!!fieldErrors.note_date}
              />
            </FormField>

            <FormField label="Category" error={fieldErrors.category}>
              <SelectInput
                value={category}
                onChange={(e) => setCategory(e.target.value as NoteCategory)}
                error={!!fieldErrors.category}
              >
                {NOTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {NOTE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Note" error={fieldErrors.note_text}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              placeholder="What should you remember about this student?"
            />
          </FormField>

          <CheckboxField
            label="Follow-up needed"
            checked={followUpNeeded}
            onChange={setFollowUpNeeded}
          />

          {followUpNeeded && (
            <FormField label="Follow-up Date" error={fieldErrors.follow_up_date}>
              <TextInput
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                error={!!fieldErrors.follow_up_date}
              />
            </FormField>
          )}

          <FormField label="Status" error={fieldErrors.status}>
            <SelectInput
              value={status}
              onChange={(e) => setStatus(e.target.value as NoteStatus)}
            >
              {Object.entries(NOTE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>

        <div className={modalFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Save Note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
