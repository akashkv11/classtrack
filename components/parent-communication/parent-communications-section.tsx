"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ParentCommunicationCard from "@/components/parent-communication/parent-communication-card";
import ParentCommunicationForm from "@/components/parent-communication/parent-communication-form";
import Alert from "@/components/ui/alert";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/loading-state";
import type {
  CommunicationReason,
  CommunicationStatus,
  CommunicationType,
  ParentCommunicationSummary,
  ParentCommunicationsListResponse,
  StudentNoteOption,
} from "@/lib/types/parent-communication";

type ParentCommunicationsSectionProps = {
  classId: string;
  studentId: string;
  initialCommunications: ParentCommunicationSummary[];
  noteOptions: StudentNoteOption[];
};

export default function ParentCommunicationsSection({
  classId,
  studentId,
  initialCommunications,
  noteOptions,
}: ParentCommunicationsSectionProps) {
  const router = useRouter();
  const [communications, setCommunications] = useState(initialCommunications);
  const [showForm, setShowForm] = useState(false);
  const [editingCommunication, setEditingCommunication] =
    useState<ParentCommunicationSummary | null>(null);
  const [deletingCommunication, setDeletingCommunication] =
    useState<ParentCommunicationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const refreshCommunications = useCallback(async () => {
    const res = await fetch(
      `/api/classes/${classId}/students/${studentId}/parent-communications`,
    );
    if (!res.ok) return;
    const data: ParentCommunicationsListResponse = await res.json();
    setCommunications(data.communications);
  }, [classId, studentId]);

  async function handleSave(data: {
    communication_date: string;
    communication_type: CommunicationType;
    reason: CommunicationReason;
    summary: string;
    student_note_id: string | null;
    follow_up_needed: boolean;
    follow_up_date: string | null;
    status: CommunicationStatus;
  }) {
    const url = editingCommunication
      ? `/api/parent-communications/${editingCommunication.id}?class_id=${classId}`
      : `/api/classes/${classId}/students/${studentId}/parent-communications`;
    const res = await fetch(url, {
      method: editingCommunication ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to save communication");
    }

    setEditingCommunication(null);
    await refreshCommunications();
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingCommunication) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/parent-communications/${deletingCommunication.id}?class_id=${classId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete communication");
      }
      setDeletingCommunication(null);
      await refreshCommunications();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete communication",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section id="parent-communication">
      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Parent Communication
          </h3>
          <Button
            size="sm"
            onClick={() => {
              setEditingCommunication(null);
              setShowForm(true);
            }}
          >
            Add Communication
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {communications.length === 0 ? (
          <EmptyState message="No communication recorded yet. Add a record when you contact a parent." />
        ) : (
          <div>
            {communications.map((communication) => (
              <ParentCommunicationCard
                key={communication.id}
                communication={communication}
                onEdit={(item) => {
                  setEditingCommunication(item);
                  setShowForm(true);
                }}
                onDelete={setDeletingCommunication}
              />
            ))}
          </div>
        )}

        <ParentCommunicationForm
          key={editingCommunication?.id ?? "new"}
          open={showForm}
          communication={editingCommunication}
          noteOptions={noteOptions}
          onClose={() => {
            setShowForm(false);
            setEditingCommunication(null);
          }}
          onSave={handleSave}
        />

        <ConfirmDialog
          open={Boolean(deletingCommunication)}
          title="Delete communication?"
          description="This communication record will be permanently deleted."
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCommunication(null)}
        />
      </Card>
    </section>
  );
}
