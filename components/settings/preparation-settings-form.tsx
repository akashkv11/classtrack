"use client";

import { useState, type FormEvent } from "react";
import SettingsSection from "@/components/settings/settings-section";
import FormField, { TextInput, CheckboxField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import type { SettingsData } from "@/lib/types";

export default function PreparationSettingsForm({ settings }: { settings: SettingsData["settings"] }) {
  const [threshold, setThreshold] = useState(String(settings.preparation_streak_threshold));
  const [includePartial, setIncludePartial] = useState(settings.preparation_include_partial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preparation_streak_threshold: Number(threshold), preparation_include_partial: includePartial }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save preparation settings.");
      setMessage("Preparation settings saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save preparation settings.");
    } finally { setSaving(false); }
  }
  return (
    <SettingsSection title="Student Preparation" description="Flag repeated lack of preparation on the dashboard and in the preparation register.">
      <form onSubmit={save} className="space-y-4">
        <FormField label="Consecutive Class Threshold" hint="An alert starts when this many consecutive recorded classes meet the rule. Not marked breaks a recorded streak.">
          <TextInput aria-label="Consecutive Class Threshold" type="number" min={1} max={30} required value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </FormField>
        <CheckboxField label="Count partially prepared students toward the streak too" checked={includePartial} onChange={setIncludePartial} />
        {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Preparation Settings"}</Button>
      </form>
    </SettingsSection>
  );
}
