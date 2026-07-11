"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import SettingsSection from "@/components/settings/settings-section";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput } from "@/components/ui/form-field";
import type { SettingsData } from "@/lib/types";
import { academicSettingsSchema, FieldErrors, parseInput } from "@/lib/validation";

type SettingsAcademicSectionProps = {
  data: SettingsData;
  activeYearId: string;
  onActiveYearChange: (id: string) => void;
  onSaved: () => Promise<void>;
};

export default function SettingsAcademicSection({
  data,
  activeYearId,
  onActiveYearChange,
  onSaved,
}: SettingsAcademicSectionProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const hasYears = data.academic_years.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(academicSettingsSchema, {
      active_academic_year_id: activeYearId,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setMessage(parsed.error);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload.error ?? "Failed to save academic settings.");
      if (payload.field_errors) setFieldErrors(payload.field_errors);
      return;
    }

    setMessage("Academic settings saved.");
    await onSaved();
  }

  return (
    <SettingsSection
      title="Academic"
      description="Active academic year and subject mapping for each class."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Active Academic Year" error={fieldErrors.active_academic_year_id}>
          {hasYears ? (
            <SelectInput
              value={activeYearId}
              onChange={(e) => onActiveYearChange(e.target.value)}
              error={!!fieldErrors.active_academic_year_id}
            >
              {data.academic_years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </SelectInput>
          ) : (
            <Alert variant="warning">Create an academic year below first.</Alert>
          )}
        </FormField>

        {data.classes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-800">Subjects per class</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {data.classes.map((cls) => (
                <li
                  key={cls.class_id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium text-slate-900">{cls.display_name}</span>
                  {cls.subjects.length > 0 ? (
                    <span>
                      {" "}
                      → {cls.subjects.map((subject) => subject.name).join(", ")}
                    </span>
                  ) : (
                    <span className="text-slate-500"> → No subjects yet</span>
                  )}
                  {" · "}
                  <Link
                    href={`/classes/${cls.class_id}/syllabus`}
                    className="font-medium text-blue-700 hover:text-blue-800"
                  >
                    Manage syllabus
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <Button type="submit" disabled={saving || !hasYears} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Academic Settings"}
        </Button>
      </form>
    </SettingsSection>
  );
}
