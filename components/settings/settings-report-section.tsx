"use client";

import { FormEvent, useEffect, useState } from "react";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import type { SettingsData } from "@/lib/types";
import { FieldErrors, parseInput, reportSettingsSchema } from "@/lib/validation";

type SettingsReportSectionProps = {
  settings: SettingsData["settings"];
  onSaved: () => Promise<void>;
};

export default function SettingsReportSection({
  settings,
  onSaved,
}: SettingsReportSectionProps) {
  const [teacherName, setTeacherName] = useState(settings.teacher_name);
  const [institutionName, setInstitutionName] = useState(settings.institution_name);
  const [reportTitle, setReportTitle] = useState(settings.report_title);
  const [messageSignature, setMessageSignature] = useState(settings.message_signature);
  const [reportFooter, setReportFooter] = useState(settings.report_footer);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setTeacherName(settings.teacher_name);
    setInstitutionName(settings.institution_name);
    setReportTitle(settings.report_title);
    setMessageSignature(settings.message_signature);
    setReportFooter(settings.report_footer);
  }, [settings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(reportSettingsSchema, {
      teacher_name: teacherName,
      institution_name: institutionName,
      report_title: reportTitle,
      message_signature: messageSignature,
      report_footer: reportFooter,
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
      setMessage(payload.error ?? "Failed to save report settings.");
      if (payload.field_errors) setFieldErrors(payload.field_errors);
      return;
    }

    setMessage("Report settings saved.");
    await onSaved();
  }

  return (
    <SettingsSection
      title="Reports"
      description="Header and footer details shown on printable reports."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teacher Name" error={fieldErrors.teacher_name}>
            <TextInput
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Akash"
              error={!!fieldErrors.teacher_name}
            />
          </FormField>

          <FormField label="Institution Name" error={fieldErrors.institution_name}>
            <TextInput
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="ClassTrack Tuition Centre"
              error={!!fieldErrors.institution_name}
            />
          </FormField>
        </div>

        <FormField label="Report Title / Header" error={fieldErrors.report_title}>
          <TextInput
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Monthly Attendance Report"
            error={!!fieldErrors.report_title}
          />
        </FormField>

        <FormField label="Signature Text" error={fieldErrors.message_signature}>
          <TextInput
            value={messageSignature}
            onChange={(e) => setMessageSignature(e.target.value)}
            error={!!fieldErrors.message_signature}
          />
        </FormField>

        <FormField label="Report Footer" error={fieldErrors.report_footer}>
          <TextInput
            value={reportFooter}
            onChange={(e) => setReportFooter(e.target.value)}
            error={!!fieldErrors.report_footer}
          />
        </FormField>

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Report Settings"}
        </Button>
      </form>
    </SettingsSection>
  );
}
