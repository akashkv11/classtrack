"use client";

import { useState } from "react";
import StudentForm from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { Student, StudentFormData } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";

type StudentsSectionProps = {
  classId: string;
  showTitle?: boolean;
};

export default function StudentsSection({ classId, showTitle = true }: StudentsSectionProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Student | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function loadData(signal?: AbortSignal) {
    const res = await fetch(`/api/classes/${classId}/students`, { signal });
    setStudents(await res.json());
    setLoading(false);
  }

  useClientEffect((signal) => loadData(signal), [classId]);

  async function handleSave(data: StudentFormData) {
    if (editing) {
      const res = await fetch(`/api/students/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update student");
      }
    } else {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add student");
      }
    }
    await loadData();
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;

    setDeactivating(true);
    const student = deactivateTarget;

    await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    await loadData();

    setDeactivating(false);
    setDeactivateTarget(null);
  }

  return (
    <section id="students">
      <div
        className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center ${
          showTitle ? "sm:justify-between" : "sm:justify-end"
        }`}
      >
        {showTitle && <h2 className="text-lg font-semibold text-slate-900">Students</h2>}
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          Add Student
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Loading students..." />
      ) : students.length === 0 ? (
        <Card>
          <EmptyState message="No students yet. Add the first student for this class." />
        </Card>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Roll No</TableHeaderCell>
              <TableHeaderCell>Full Name</TableHeaderCell>
              <TableHeaderCell>Admission No</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.roll_no}</TableCell>
                <TableCell>{student.full_name}</TableCell>
                <TableCell>{student.admission_no ?? "—"}</TableCell>
                <TableCell>{student.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={student.is_active ? "success" : "neutral"}>
                    {student.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(student);
                        setFormOpen(true);
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {student.is_active && (
                      <button
                        onClick={() => setDeactivateTarget(student)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {formOpen && (
        <StudentForm
          key={editing?.id ?? "new"}
          open
          student={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Deactivate student?"
        description={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.full_name}? They will no longer appear in active student lists.`
            : ""
        }
        confirmLabel="Deactivate"
        confirmVariant="danger"
        loading={deactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </section>
  );
}
