"use client";

import { FormEvent, useEffect, useState } from "react";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import FormField, { CheckboxField, TextInput } from "@/components/ui/form-field";
import type { SettingsData } from "@/lib/types";
import { attendanceThresholdsSchema, FieldErrors, parseInput } from "@/lib/validation";

type SettingsAttendanceSectionProps = {
  settings: SettingsData["settings"];
  onSaved: () => Promise<void>;
};

export default function SettingsAttendanceSection({
  settings,
  onSaved,
}: SettingsAttendanceSectionProps) {
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(
    String(settings.low_attendance_threshold),
  );
  const [continuousAbsenceThreshold, setContinuousAbsenceThreshold] = useState(
    String(settings.continuous_absence_threshold),
  );
  const [monthlyAbsenceThreshold, setMonthlyAbsenceThreshold] = useState(
    String(settings.monthly_absence_threshold),
  );
  const [lateCountsAsPresent, setLateCountsAsPresent] = useState(
    settings.late_counts_as_present,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setLowAttendanceThreshold(String(settings.low_attendance_threshold));
    setContinuousAbsenceThreshold(String(settings.continuous_absence_threshold));
    setMonthlyAbsenceThreshold(String(settings.monthly_absence_threshold));
    setLateCountsAsPresent(settings.late_counts_as_present);
  }, [settings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(attendanceThresholdsSchema, {
      low_attendance_threshold: lowAttendanceThreshold,
      continuous_absence_threshold: continuousAbsenceThreshold,
      monthly_absence_threshold: monthlyAbsenceThreshold,
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
      setMessage(payload.error ?? "Failed to save attendance settings.");
      if (payload.field_errors) setFieldErrors(payload.field_errors);
      return;
    }

    setMessage("Attendance settings saved.");
    await onSaved();
  }

  return (
    <SettingsSection
      title="Attendance"
      description="Thresholds used by Attendance Alerts and attendance percentage rules."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Low Attendance Threshold (%)" error={fieldErrors.low_attendance_threshold}>
            <TextInput
              type="number"
              min={1}
              max={100}
              value={lowAttendanceThreshold}
              onChange={(e) => setLowAttendanceThreshold(e.target.value)}
              error={!!fieldErrors.low_attendance_threshold}
            />
          </FormField>

          <FormField
            label="Continuous Absence Alert (classes)"
            error={fieldErrors.continuous_absence_threshold}
          >
            <TextInput
              type="number"
              min={1}
              max={30}
              value={continuousAbsenceThreshold}
              onChange={(e) => setContinuousAbsenceThreshold(e.target.value)}
              error={!!fieldErrors.continuous_absence_threshold}
            />
          </FormField>

          <FormField
            label="Monthly Absence Alert (absences)"
            error={fieldErrors.monthly_absence_threshold}
          >
            <TextInput
              type="number"
              min={1}
              max={30}
              value={monthlyAbsenceThreshold}
              onChange={(e) => setMonthlyAbsenceThreshold(e.target.value)}
              error={!!fieldErrors.monthly_absence_threshold}
            />
          </FormField>
        </div>

        <CheckboxField
          label="Late counts as present for percentage calculation"
          checked={lateCountsAsPresent}
          onChange={setLateCountsAsPresent}
        />

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Attendance Settings"}
        </Button>
      </form>
    </SettingsSection>
  );
}
