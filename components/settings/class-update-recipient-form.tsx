"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import FormField, { TextInput } from "@/components/ui/form-field";
import { optionalWhatsAppSchema } from "@/lib/validation/primitives";

export default function ClassUpdateRecipientForm({ initialValue }: { initialValue: string }) {
  const [number, setNumber] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const parsed = optionalWhatsAppSchema.safeParse(number);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_update_recipient: parsed.data }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save recipient.");
      }
      setMessage("Class update recipient saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recipient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-6 space-y-3">
      <FormField
        label="Class Update Recipient"
        hint="Default WhatsApp number for the separate CLASS UPDATE template, shared across classes. Include the country code."
        error={error}
      >
        <TextInput
          aria-label="Class Update Recipient"
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="91XXXXXXXXXX"
          error={!!error}
        />
      </FormField>
      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving..." : "Save Class Update Recipient"}
      </Button>
    </form>
  );
}
