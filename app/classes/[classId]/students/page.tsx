"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import StudentForm from "@/components/StudentForm";

type Student = {
  id: string;
  roll_no: number;
  full_name: string;
  admission_no: string | null;
  parent_phone: string | null;
  is_active: boolean;
};

export default function StudentsPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;

  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const loadData = useCallback(async () => {
    const [studentsRes, classRes] = await Promise.all([
      fetch(`/api/classes/${classId}/students`),
      fetch(`/api/classes/${classId}`),
    ]);
    setStudents(await studentsRes.json());
    const cls = await classRes.json();
    setClassName(cls.display_name ?? "");
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave(data: {
    roll_no: number;
    full_name: string;
    admission_no: string;
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
    <>
      <AppHeader
        title="Students"
        subtitle={className}
        backHref={`/classes/${classId}`}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-4 flex justify-end">
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
          <p className="text-slate-600">Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Roll No</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Full Name</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Admission No</th>
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
      </main>

      <StudentForm
        open={formOpen}
        student={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </>
  );
}
