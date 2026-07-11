"use client";

import { useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { CheckboxField, SelectInput, TextInput } from "@/components/ui/form-field";
import { formatDisplayDate, todayISO } from "@/lib/dates";
import {
  COMMUNICATION_REASONS,
  COMMUNICATION_REASON_LABELS,
  COMMUNICATION_STATUSES,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPES,
  COMMUNICATION_TYPE_LABELS,
} from "@/lib/parent-communication/status";
import { NOTE_CATEGORY_LABELS } from "@/lib/student-notes/status";
import type { NoteCategory } from "@/lib/types/student-note";
import {
  FieldErrors,
  parseInput,
  parentCommunicationCreateSchema,
  parentCommunicationUpdateSchema,
} from "@/lib/validation";
import type {
  CommunicationReason,
  CommunicationStatus,
  CommunicationType,
  ParentCommunicationSummary,
  StudentNoteOption,
} from "@/lib/types/parent-communication";

type ParentCommunicationFormProps = {
  open: boolean;
  communication?: ParentCommunicationSummary | null;
  noteOptions: StudentNoteOption[];
  onClose: () => void;
  onSave: (data: {
    communication_date: string;
    communication_type: CommunicationType;
    reason: CommunicationReason;
    summary: string;
    student_note_id: string | null;
    follow_up_needed: boolean;
    follow_up_date: string | null;
    status: CommunicationStatus;
  }) => Promise<void>;
};

function noteOptionLabel(note: StudentNoteOption): string {
  const category =
    NOTE_CATEGORY_LABELS[note.category as NoteCategory] ?? note.category;
  const preview =
    note.note_text.length > 60
      ? `${note.note_text.slice(0, 60)}…`
      : note.note_text;
  return `${formatDisplayDate(new Date(note.note_date + "T00:00:00Z"))} · ${category} · ${preview}`;
}

export default function ParentCommunicationForm({
  open,
  communication,
  noteOptions,
  onClose,
  onSave,
}: ParentCommunicationFormProps) {
  const isEdit = Boolean(communication);

  const [communicationDate, setCommunicationDate] = useState(
    () => communication?.communication_date ?? todayISO(),
  );
  const [communicationType, setCommunicationType] = useState<CommunicationType>(
    () => communication?.communication_type ?? "WHATSAPP",
  );
  const [reason, setReason] = useState<CommunicationReason>(
    () => communication?.reason ?? "GENERAL",
  );
  const [summary, setSummary] = useState(() => communication?.summary ?? "");
  const [studentNoteId, setStudentNoteId] = useState(
    () => communication?.linked_note?.id ?? "",
  );
  const [followUpNeeded, setFollowUpNeeded] = useState(
    () => communication?.follow_up_needed ?? false,
  );
  const [followUpDate, setFollowUpDate] = useState(
    () => communication?.follow_up_date ?? "",
  );
  const [status, setStatus] = useState<CommunicationStatus>(
    () => communication?.status ?? "OPEN",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const payload = {
      communication_date: communicationDate,
      communication_type: communicationType,
      reason,
      summary,
      student_note_id: studentNoteId || null,
      follow_up_needed: followUpNeeded,
      follow_up_date: followUpNeeded ? followUpDate || null : null,
      status,
    };

    const parsed = isEdit
      ? parseInput(parentCommunicationUpdateSchema, payload)
      : parseInput(parentCommunicationCreateSchema, payload);

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      setLoading(false);
      return;
    }

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save communication");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Communication" : "Add Parent Communication"}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" error={fieldErrors.communication_date}>
              <TextInput
                type="date"
                value={communicationDate}
                onChange={(e) => setCommunicationDate(e.target.value)}
                error={!!fieldErrors.communication_date}
              />
            </FormField>

            <FormField label="Type" error={fieldErrors.communication_type}>
              <SelectInput
                value={communicationType}
                onChange={(e) =>
                  setCommunicationType(e.target.value as CommunicationType)
                }
              >
                {COMMUNICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {COMMUNICATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Reason" error={fieldErrors.reason}>
            <SelectInput
              value={reason}
              onChange={(e) => setReason(e.target.value as CommunicationReason)}
            >
              {COMMUNICATION_REASONS.map((item) => (
                <option key={item} value={item}>
                  {COMMUNICATION_REASON_LABELS[item]}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Summary" error={fieldErrors.summary}>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              placeholder="What was discussed with the parent?"
            />
          </FormField>

          {noteOptions.length > 0 && (
            <FormField label="Linked Student Note (optional)">
              <SelectInput
                value={studentNoteId}
                onChange={(e) => setStudentNoteId(e.target.value)}
              >
                <option value="">No linked note</option>
                {noteOptions.map((note) => (
                  <option key={note.id} value={note.id}>
                    {noteOptionLabel(note)}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

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
              onChange={(e) => setStatus(e.target.value as CommunicationStatus)}
            >
              {COMMUNICATION_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {COMMUNICATION_STATUS_LABELS[item]}
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
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Save Communication"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
