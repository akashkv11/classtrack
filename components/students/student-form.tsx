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
import { parentPhoneInputValue } from "@/lib/phone";

type StudentFormProps = {
  open: boolean;
  student?: Student | null;
  onClose: () => void;
  onSave: (data: StudentFormData) => Promise<void>;
};

function initialFormState(student?: Student | null) {
  return {
    fullName: student?.full_name ?? "",
    parentPhone: parentPhoneInputValue(student?.parent_phone),
    isActive: student?.is_active ?? true,
  };
}

export default function StudentForm({
  open,
  student,
  onClose,
  onSave,
}: StudentFormProps) {
  const [fullName, setFullName] = useState(
    () => initialFormState(student).fullName,
  );
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
      full_name: fullName,
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
        {!student && <p className="text-sm text-slate-600">Roll and admission numbers will be assigned automatically when saved.</p>}
        <FormField label="Full Name" error={fieldErrors.full_name}>
          <TextInput
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={!!fieldErrors.full_name}
            className="w-full"
          />
        </FormField>
        <FormField
          label="Parent Phone (optional)"
          error={fieldErrors.parent_phone}
          hint="Enter the 10-digit number without +91."
        >
          <TextInput
            aria-label="Parent phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[0-9]{10}"
            maxLength={10}
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ""))}
            onPaste={(e) => {
              e.preventDefault();
              setParentPhone(parentPhoneInputValue(e.clipboardData.getData("text")));
            }}
            placeholder="9876543210"
            error={!!fieldErrors.parent_phone}
            className="w-full"
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
