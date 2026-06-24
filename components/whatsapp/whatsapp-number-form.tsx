"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import { WarningPanel } from "@/components/ui/alert";
import { classSettingsPatchSchema, FieldErrors, parseInput } from "@/lib/validation";

type WhatsAppNumberFormProps = {
  classId: string;
  initialValue?: string;
  onSaved?: () => void | Promise<void>;
  variant?: "panel" | "inline";
};

export default function WhatsAppNumberForm({
  classId,
  initialValue = "",
  onSaved,
  variant = "panel",
}: WhatsAppNumberFormProps) {
  const [whatsappNumber, setWhatsappNumber] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setFieldErrors({});

    const parsed = parseInput(classSettingsPatchSchema, {
      whatsapp_number: whatsappNumber,
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
      setMessage(payload.error ?? "Failed to save WhatsApp number.");
      if (payload.field_errors) {
        setFieldErrors(payload.field_errors);
      }
      return;
    }

    setMessage("WhatsApp number saved.");
    await onSaved?.();
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormField
        label="WhatsApp Number"
        error={fieldErrors.whatsapp_number}
        hint="Country code + number, no + or spaces (e.g. 91XXXXXXXXXX)"
      >
        <TextInput
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="91XXXXXXXXXX"
          error={!!fieldErrors.whatsapp_number}
        />
      </FormField>
      {message && <p className="text-sm text-slate-700">{message}</p>}
      <Button type="submit" variant={variant === "panel" ? "amber" : "primary"} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving..." : "Save WhatsApp Number"}
      </Button>
    </form>
  );

  if (variant === "inline") {
    return form;
  }

  return (
    <WarningPanel
      title="Set up WhatsApp"
      description="Add the class WhatsApp group number to send the absentee message."
      className="mb-6"
    >
      {form}
    </WarningPanel>
  );
}
