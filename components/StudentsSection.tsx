"use client";

import { useState } from "react";
import StudentForm from "@/components/StudentForm";
import { useClientEffect } from "@/lib/use-client-effect";

type Student = {
  id: string;
  roll_no: number;
  full_name: string;
  admission_no: string | null;
  email: string | null;
  parent_phone: string | null;
  is_active: boolean;
};

type StudentsSectionProps = {
  classId: string;
};

export default function StudentsSection({ classId }: StudentsSectionProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  async function loadData(signal?: AbortSignal) {
    const res = await fetch(`/api/classes/${classId}/students`, { signal });
    setStudents(await res.json());
    setLoading(false);
  }

  useClientEffect((signal) => loadData(signal), [classId]);

  async function handleSave(data: {
    roll_no: number;
    full_name: string;
    admission_no: string;
    email: string;
    parent_phone: string;
    is_active: boolean;
  }) {
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

  async function handleDeactivate(student: Student) {
    if (!confirm(`Deactivate ${student.full_name}?`)) return;
    await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    await loadData();
  }

  return (
    <section id="students">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Students</h2>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Student
        </button>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading students...</p>
      ) : students.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No students yet. Add the first student for this class.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Roll No</th>
                <th className="px-4 py-3 font-medium text-slate-700">Full Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">Admission No</th>
                <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{student.roll_no}</td>
                  <td className="px-4 py-3">{student.full_name}</td>
                  <td className="px-4 py-3">{student.admission_no ?? "—"}</td>
                  <td className="px-4 py-3">{student.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        student.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                          onClick={() => handleDeactivate(student)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </section>
  );
}
