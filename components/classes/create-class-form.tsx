"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
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
  onCreated?: () => void | Promise<void>;
};

export default function CreateClassForm({ onCreated }: CreateClassFormProps) {
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

    setMessage("Class created.");
    displayNameTouchedRef.current = false;
    setLevel("plus_one");
    setStream("science");
    setDisplayName(buildClassDisplayName("plus_one", "science"));
    await onCreated?.();
    router.refresh();
  }

  return (
    <Card padding="lg" className="mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Create Class</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a new class for the active academic year.
          </p>
        </div>

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

        <Button type="submit" variant="dark" disabled={creating} className="w-full sm:w-auto">
          {creating ? "Creating..." : "Create Class"}
        </Button>
      </form>
    </Card>
  );
}
