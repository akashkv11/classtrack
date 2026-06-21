"use client";

import { useEffect, useState } from "react";

type Student = {
  id: string;
  roll_no: number;
  full_name: string;
  admission_no: string | null;
  parent_phone: string | null;
  is_active: boolean;
};

type StudentFormProps = {
  open: boolean;
  student?: Student | null;
  onClose: () => void;
  onSave: (data: {
    roll_no: number;
    full_name: string;
    admission_no: string;
    parent_phone: string;
    is_active: boolean;
  }) => Promise<void>;
};

export default function StudentForm({ open, student, onClose, onSave }: StudentFormProps) {
  const [rollNo, setRollNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setRollNo(String(student.roll_no));
      setFullName(student.full_name);
      setAdmissionNo(student.admission_no ?? "");
      setParentPhone(student.parent_phone ?? "");
      setIsActive(student.is_active);
    } else {
      setRollNo("");
      setFullName("");
      setAdmissionNo("");
      setParentPhone("");
      setIsActive(true);
    }
    setError("");
  }, [student, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave({
        roll_no: Number(rollNo),
        full_name: fullName.trim(),
        admission_no: admissionNo.trim(),
        parent_phone: parentPhone.trim(),
        is_active: isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {student ? "Edit Student" : "Add Student"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Roll No</label>
            <input
              type="number"
              min={1}
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Admission No</label>
            <input
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Parent Phone (optional)
            </label>
            <input
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
