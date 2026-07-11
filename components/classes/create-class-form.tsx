"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import {
  buildClassDisplayName,
  CLASS_LEVELS,
  CLASS_STREAMS,
  type ClassLevel,
  type ClassStream,
} from "@/lib/classes/constants";
import { classCreateSchema, FieldErrors, parseInput } from "@/lib/validation";

type CreateClassFormProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
};

function CreateClassFormDialog({
  onClose,
  onCreated,
}: Omit<CreateClassFormProps, "open">) {
  const router = useRouter();
  const [level, setLevel] = useState<ClassLevel>("plus_one");
  const [stream, setStream] = useState<ClassStream>("science");
  const [displayName, setDisplayName] = useState(() =>
    buildClassDisplayName("plus_one", "science"),
  );
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const displayNameTouchedRef = useRef(false);

  useEffect(() => {
    if (displayNameTouchedRef.current) return;
    setDisplayName(buildClassDisplayName(level, stream));
  }, [level, stream]);

  function resetForm() {
    displayNameTouchedRef.current = false;
    setLevel("plus_one");
    setStream("science");
    setDisplayName(buildClassDisplayName("plus_one", "science"));
    setMessage("");
    setFieldErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(classCreateSchema, {
      level,
      stream,
      display_name: displayName,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setMessage(parsed.error);
      setCreating(false);
      return;
    }

    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setCreating(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload.error ?? "Failed to create class.");
      if (payload.field_errors) {
        setFieldErrors(payload.field_errors);
      }
      return;
    }

    resetForm();
    await onCreated?.();
    router.refresh();
    onClose();
  }

  return (
    <Modal
      open
      title="Create Class"
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={creating}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-class-form"
            variant="dark"
            disabled={creating}
            className="w-full sm:w-auto"
          >
            {creating ? "Creating..." : "Create Class"}
          </Button>
        </div>
      }
    >
      <form id="create-class-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Add a new class for the active academic year.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Level" error={fieldErrors.level}>
            <SelectInput
              value={level}
              onChange={(e) => setLevel(e.target.value as ClassLevel)}
              error={!!fieldErrors.level}
            >
              {CLASS_LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Stream" error={fieldErrors.stream}>
            <SelectInput
              value={stream}
              onChange={(e) => setStream(e.target.value as ClassStream)}
              error={!!fieldErrors.stream}
            >
              {CLASS_STREAMS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>

        <FormField label="Display Name" error={fieldErrors.display_name}>
          <TextInput
            value={displayName}
            onChange={(e) => {
              displayNameTouchedRef.current = true;
              setDisplayName(e.target.value);
            }}
            placeholder="e.g. Plus Two Commerce"
            error={!!fieldErrors.display_name}
          />
        </FormField>

        {message && <p className="text-sm text-slate-700">{message}</p>}
      </form>
    </Modal>
  );
}

export default function CreateClassForm({ open, onClose, onCreated }: CreateClassFormProps) {
  if (!open) return null;

  return <CreateClassFormDialog key="create-class" onClose={onClose} onCreated={onCreated} />;
}
