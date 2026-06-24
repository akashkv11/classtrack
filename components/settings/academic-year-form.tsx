"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import FormField, { TextInput } from "@/components/ui/form-field";
import { academicYearSchema, FieldErrors, parseInput } from "@/lib/validation";

const defaultNewYear = () => {
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  return {
    name: `${startYear}-${endYear}`,
    start_date: `${startYear}-06-01`,
    end_date: `${endYear}-03-31`,
  };
};

type AcademicYearFormProps = {
  hasYears: boolean;
  onCreated: () => Promise<void>;
};

export default function AcademicYearForm({ hasYears, onCreated }: AcademicYearFormProps) {
  const [newYear, setNewYear] = useState(defaultNewYear);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(academicYearSchema, newYear);
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setMessage(parsed.error);
      setCreating(false);
      return;
    }

    const res = await fetch("/api/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setCreating(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload.error ?? "Failed to create academic year.");
      if (payload.field_errors) {
        setFieldErrors(payload.field_errors);
      }
      return;
    }

    setMessage("Academic year created.");
    setNewYear(defaultNewYear());
    await onCreated();
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {hasYears ? "Add Academic Year" : "Create Academic Year"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {hasYears
              ? "Add another year to switch between later."
              : "Set up your first academic year to start using ClassTrack."}
          </p>
        </div>

        <FormField label="Year Name" error={fieldErrors.name}>
          <TextInput
            value={newYear.name}
            onChange={(e) => setNewYear((current) => ({ ...current, name: e.target.value }))}
            placeholder="2026-2027"
            error={!!fieldErrors.name}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start Date" error={fieldErrors.start_date}>
            <TextInput
              type="date"
              value={newYear.start_date}
              onChange={(e) =>
                setNewYear((current) => ({ ...current, start_date: e.target.value }))
              }
              error={!!fieldErrors.start_date}
            />
          </FormField>
          <FormField label="End Date" error={fieldErrors.end_date}>
            <TextInput
              type="date"
              value={newYear.end_date}
              onChange={(e) =>
                setNewYear((current) => ({ ...current, end_date: e.target.value }))
              }
              error={!!fieldErrors.end_date}
            />
          </FormField>
        </div>

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <Button type="submit" variant="dark" disabled={creating}>
          {creating ? "Creating..." : "Create Academic Year"}
        </Button>
      </form>
    </Card>
  );
}
