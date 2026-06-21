"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";

type SettingsData = {
  academic_years: { id: string; name: string; is_active: boolean }[];
  settings: {
    message_signature: string;
    late_counts_as_present: boolean;
  };
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [activeYearId, setActiveYearId] = useState("");
  const [messageSignature, setMessageSignature] = useState("");
  const [lateCountsAsPresent, setLateCountsAsPresent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const payload = await res.json();
    setData(payload);
    const active = payload.academic_years.find(
      (y: { is_active: boolean }) => y.is_active,
    );
    setActiveYearId(active?.id ?? payload.academic_years[0]?.id ?? "");
    setMessageSignature(payload.settings.message_signature);
    setLateCountsAsPresent(payload.settings.late_counts_as_present);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        active_academic_year_id: activeYearId,
        message_signature: messageSignature,
        late_counts_as_present: lateCountsAsPresent,
      }),
    });

    setSaving(false);
    setMessage(res.ok ? "Settings saved." : "Failed to save settings.");
    if (res.ok) await loadSettings();
  }

  return (
    <>
      <AppHeader title="Settings" backHref="/dashboard" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {!data ? (
          <p className="text-slate-600">Loading...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Active Academic Year
              </label>
              <select
                value={activeYearId}
                onChange={(e) => setActiveYearId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {data.academic_years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Message Signature
              </label>
              <input
                value={messageSignature}
                onChange={(e) => setMessageSignature(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lateCountsAsPresent}
                onChange={(e) => setLateCountsAsPresent(e.target.checked)}
              />
              Late counts as present for percentage calculation
            </label>

            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              App password is configured via the <code>APP_PASSWORD</code> environment variable.
            </div>

            {message && <p className="text-sm text-slate-700">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
