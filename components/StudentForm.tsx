"use client";

import { useState } from "react";
import FieldError from "@/components/FieldError";
import {
  FieldErrors,
  inputClassName,
  parseInput,
  studentFormSchema,
} from "@/lib/validation";

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

function initialFormState(student?: Student | null) {
  return {
    rollNo: student ? String(student.roll_no) : "",
    fullName: student?.full_name ?? "",
    admissionNo: student?.admission_no ?? "",
    parentPhone: student?.parent_phone ?? "",
    isActive: student?.is_active ?? true,
  };
}

export default function StudentForm({ open, student, onClose, onSave }: StudentFormProps) {
  const [rollNo, setRollNo] = useState(() => initialFormState(student).rollNo);
  const [fullName, setFullName] = useState(() => initialFormState(student).fullName);
  const [admissionNo, setAdmissionNo] = useState(() => initialFormState(student).admissionNo);
  const [parentPhone, setParentPhone] = useState(() => initialFormState(student).parentPhone);
  const [isActive, setIsActive] = useState(() => initialFormState(student).isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = parseInput(studentFormSchema, {
      roll_no: rollNo,
      full_name: fullName,
      admission_no: admissionNo,
      parent_phone: parentPhone,
      is_active: isActive,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        roll_no: parsed.data.roll_no,
        full_name: parsed.data.full_name,
        admission_no: parsed.data.admission_no,
        parent_phone: parsed.data.parent_phone,
        is_active: parsed.data.is_active,
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
              step={1}
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className={inputClassName(!!fieldErrors.roll_no)}
            />
            <FieldError message={fieldErrors.roll_no} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClassName(!!fieldErrors.full_name)}
            />
            <FieldError message={fieldErrors.full_name} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Admission No</label>
            <input
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              className={inputClassName(!!fieldErrors.admission_no)}
            />
            <FieldError message={fieldErrors.admission_no} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Parent Phone (optional)
            </label>
            <input
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="91XXXXXXXXXX"
              className={inputClassName(!!fieldErrors.parent_phone)}
            />
            <FieldError message={fieldErrors.parent_phone} />
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
