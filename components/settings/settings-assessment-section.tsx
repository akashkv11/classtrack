"use client";

import { FormEvent, useState } from "react";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import type { SettingsData } from "@/lib/types";
import { assessmentThresholdsSchema, FieldErrors, parseInput } from "@/lib/validation";

type SettingsAssessmentSectionProps = {
  settings: SettingsData["settings"];
  onSaved: () => Promise<void>;
};

export default function SettingsAssessmentSection({
  settings,
  onSaved,
}: SettingsAssessmentSectionProps) {
  const [lowMarksThreshold, setLowMarksThreshold] = useState(
    String(settings.low_marks_threshold_percent),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(assessmentThresholdsSchema, {
      low_marks_threshold_percent: lowMarksThreshold,
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
      setMessage(payload.error ?? "Failed to save assessment settings.");
      if (payload.field_errors) setFieldErrors(payload.field_errors);
      return;
    }

    setMessage("Assessment settings saved.");
    await onSaved();
  }

  return (
    <SettingsSection
      title="Assessments"
      description="Low marks threshold used in assessment summaries and dashboard highlights."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Low Marks Threshold (%)"
          error={fieldErrors.low_marks_threshold_percent}
          hint="Students scoring below this percentage of max marks are flagged."
        >
          <TextInput
            type="number"
            min={1}
            max={100}
            value={lowMarksThreshold}
            onChange={(e) => setLowMarksThreshold(e.target.value)}
            error={!!fieldErrors.low_marks_threshold_percent}
          />
        </FormField>

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Assessment Settings"}
        </Button>
      </form>
    </SettingsSection>
  );
}
