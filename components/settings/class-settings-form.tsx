"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import FormField, { CheckboxField, TextInput } from "@/components/ui/form-field";
import type { ClassSummary } from "@/lib/types";
import {
  classSettingsFormSchema,
  FieldErrors,
  parseInput,
} from "@/lib/validation";

type ClassSettingsFormProps = {
  classId: string;
  initialData: ClassSummary;
  onSaved?: () => void | Promise<void>;
};

export default function ClassSettingsForm({
  classId,
  initialData,
  onSaved,
}: ClassSettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialData.display_name);
  const [whatsappNumber, setWhatsappNumber] = useState(initialData.whatsapp_number ?? "");
  const [isActive, setIsActive] = useState(initialData.is_active);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(classSettingsFormSchema, {
      display_name: displayName,
      whatsapp_number: whatsappNumber,
      is_active: isActive,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setMessage(parsed.error);
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload.error ?? "Failed to save changes.");
      if (payload.field_errors) {
        setFieldErrors(payload.field_errors);
      }
      return;
    }

    setMessage("Changes saved.");
    await onSaved?.();
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Class Display Name" error={fieldErrors.display_name}>
          <TextInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={!!fieldErrors.display_name}
          />
        </FormField>
        <FormField
          label="WhatsApp Number"
          error={fieldErrors.whatsapp_number}
          hint="Format: country code + number, no + or spaces"
        >
          <TextInput
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="91XXXXXXXXXX"
            error={!!fieldErrors.whatsapp_number}
          />
        </FormField>
        <CheckboxField label="Active" checked={isActive} onChange={setIsActive} />
        {message && <p className="text-sm text-slate-700">{message}</p>}
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Card>
  );
}
