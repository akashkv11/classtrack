"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Alert from "@/components/ui/alert";
import FormField, { CheckboxField, SelectInput, TextInput } from "@/components/ui/form-field";
import type { SettingsData } from "@/lib/types";
import { FieldErrors, parseInput, settingsFormSchema } from "@/lib/validation";

type AppSettingsFormProps = {
  data: SettingsData;
  activeYearId: string;
  messageSignature: string;
  lateCountsAsPresent: boolean;
  onActiveYearChange: (id: string) => void;
  onMessageSignatureChange: (value: string) => void;
  onLateCountsAsPresentChange: (value: boolean) => void;
  onSaved: () => Promise<void>;
};

export default function AppSettingsForm({
  data,
  activeYearId,
  messageSignature,
  lateCountsAsPresent,
  onActiveYearChange,
  onMessageSignatureChange,
  onLateCountsAsPresentChange,
  onSaved,
}: AppSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasYears = data.academic_years.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(settingsFormSchema, {
      active_academic_year_id: activeYearId,
      message_signature: messageSignature,
      late_counts_as_present: lateCountsAsPresent,
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
      setMessage(payload.error ?? "Failed to save settings.");
      if (payload.field_errors) {
        setFieldErrors(payload.field_errors);
      }
      return;
    }

    setMessage("Settings saved.");
    await onSaved();
  }

  return (
    <Card padding="lg">
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
            <Alert variant="warning">
              No academic years yet. Create one above first.
            </Alert>
          )}
        </FormField>

        <FormField label="Message Signature" error={fieldErrors.message_signature}>
          <TextInput
            value={messageSignature}
            onChange={(e) => onMessageSignatureChange(e.target.value)}
            error={!!fieldErrors.message_signature}
          />
        </FormField>

        <CheckboxField
          label="Late counts as present for percentage calculation"
          checked={lateCountsAsPresent}
          onChange={onLateCountsAsPresentChange}
        />

        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          App password is configured via the <code>APP_PASSWORD</code> environment variable.
        </div>

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <Button type="submit" disabled={saving || !hasYears} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Card>
  );
}
