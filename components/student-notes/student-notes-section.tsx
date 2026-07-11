"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import StudentNoteCard from "@/components/student-notes/student-note-card";
import StudentNoteForm from "@/components/student-notes/student-note-form";
import Alert from "@/components/ui/alert";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/loading-state";
import type {
  NoteCategory,
  NoteStatus,
  StudentNoteSummary,
  StudentNotesListResponse,
} from "@/lib/types/student-note";

type StudentNotesSectionProps = {
  classId: string;
  studentId: string;
  initialNotes: StudentNoteSummary[];
};

export default function StudentNotesSection({
  classId,
  studentId,
  initialNotes,
}: StudentNotesSectionProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<StudentNoteSummary | null>(
    null,
  );
  const [deletingNote, setDeletingNote] = useState<StudentNoteSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const refreshNotes = useCallback(async () => {
    const res = await fetch(
      `/api/classes/${classId}/students/${studentId}/notes`,
    );
    if (!res.ok) return;
    const data: StudentNotesListResponse = await res.json();
    setNotes(data.notes);
  }, [classId, studentId]);

  async function handleSave(data: {
    note_date: string;
    category: NoteCategory;
    note_text: string;
    follow_up_needed: boolean;
    follow_up_date: string | null;
    status: NoteStatus;
  }) {
    const url = editingNote
      ? `/api/student-notes/${editingNote.id}?class_id=${classId}`
      : `/api/classes/${classId}/students/${studentId}/notes`;
    const res = await fetch(url, {
      method: editingNote ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to save note");
    }

    setEditingNote(null);
    await refreshNotes();
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingNote) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/student-notes/${deletingNote.id}?class_id=${classId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete note");
      }
      setDeletingNote(null);
      await refreshNotes();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(note: StudentNoteSummary) {
    setError("");
    const newStatus: NoteStatus = note.status === "OPEN" ? "CLOSED" : "OPEN";
    const res = await fetch(
      `/api/student-notes/${note.id}?class_id=${classId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to update note status");
      return;
    }

    await refreshNotes();
    router.refresh();
  }

  return (
    <section id="student-notes" className="mt-8">
      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Student Notes
          </h3>
          <Button
            size="sm"
            onClick={() => {
              setEditingNote(null);
              setShowForm(true);
            }}
          >
            Add Note
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {notes.length === 0 ? (
          <EmptyState message="No notes yet. Add a note to record observations and follow-ups for this student." />
        ) : (
          <div>
            {notes.map((note) => (
              <StudentNoteCard
                key={note.id}
                note={note}
                onEdit={(n) => {
                  setEditingNote(n);
                  setShowForm(true);
                }}
                onDelete={setDeletingNote}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        <StudentNoteForm
          key={editingNote?.id ?? "new"}
          open={showForm}
          note={editingNote}
          onClose={() => {
            setShowForm(false);
            setEditingNote(null);
          }}
          onSave={handleSave}
        />

        <ConfirmDialog
          open={Boolean(deletingNote)}
          title="Delete note?"
          description="This note will be permanently deleted."
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingNote(null)}
        />
      </Card>
    </section>
  );
}
