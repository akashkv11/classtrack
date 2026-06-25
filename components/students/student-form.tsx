"use client";

import { useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import FormField, {
  CheckboxField,
  TextInput,
} from "@/components/ui/form-field";
import Alert from "@/components/ui/alert";
import type { Student, StudentFormData } from "@/lib/types";
import { FieldErrors, parseInput, studentFormSchema } from "@/lib/validation";

type StudentFormProps = {
  open: boolean;
  student?: Student | null;
  onClose: () => void;
  onSave: (data: StudentFormData) => Promise<void>;
};

function initialFormState(student?: Student | null) {
  return {
    rollNo: student ? String(student.roll_no) : "",
    fullName: student?.full_name ?? "",
    admissionNo: student?.admission_no ?? "",
    email: student?.email ?? "",
    parentPhone: student?.parent_phone ?? "",
    isActive: student?.is_active ?? true,
  };
}

export default function StudentForm({
  open,
  student,
  onClose,
  onSave,
}: StudentFormProps) {
  const [rollNo, setRollNo] = useState(() => initialFormState(student).rollNo);
  const [fullName, setFullName] = useState(
    () => initialFormState(student).fullName,
  );
  const [admissionNo, setAdmissionNo] = useState(
    () => initialFormState(student).admissionNo,
  );
  const [email, setEmail] = useState(() => initialFormState(student).email);
  const [parentPhone, setParentPhone] = useState(
    () => initialFormState(student).parentPhone,
  );
  const [isActive, setIsActive] = useState(
    () => initialFormState(student).isActive,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = parseInput(studentFormSchema, {
      roll_no: rollNo,
      full_name: fullName,
      admission_no: admissionNo,
      email,
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
      await onSave(parsed.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title={student ? "Edit Student" : "Add Student"}
      onClose={onClose}
      footer={
        <div className={`${modalFooterClassName} mt-4`}>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="student-form"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <form id="student-form" onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Roll No" error={fieldErrors.roll_no}>
          <TextInput
            type="number"
            min={1}
            step={1}
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            error={!!fieldErrors.roll_no}
            className="w-90 "
          />
        </FormField>
        <FormField label="Full Name" error={fieldErrors.full_name}>
          <TextInput
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={!!fieldErrors.full_name}
            className="w-90 "
          />
        </FormField>
        <FormField label="Admission No" error={fieldErrors.admission_no}>
          <TextInput
            value={admissionNo}
            onChange={(e) => setAdmissionNo(e.target.value)}
            error={!!fieldErrors.admission_no}
            className="w-90 "
          />
        </FormField>
        <FormField label="Email (optional)" error={fieldErrors.email}>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            error={!!fieldErrors.email}
            className="w-90 "
          />
        </FormField>
        <FormField
          label="Parent Phone (optional)"
          error={fieldErrors.parent_phone}
        >
          <TextInput
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            placeholder="91XXXXXXXXXX"
            error={!!fieldErrors.parent_phone}
            className="w-90 "
          />
        </FormField>
        <CheckboxField
          label="Active"
          checked={isActive}
          onChange={setIsActive}
        />
        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </Modal>
  );
}
