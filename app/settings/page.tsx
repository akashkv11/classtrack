"use client";

import { FormEvent, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useClientEffect } from "@/lib/use-client-effect";

type SettingsData = {
  academic_years: { id: string; name: string; is_active: boolean }[];
  settings: {
    message_signature: string;
    late_counts_as_present: boolean;
  };
};

const defaultNewYear = () => {
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  return {
    name: `${startYear}-${endYear}`,
    start_date: `${startYear}-06-01`,
    end_date: `${endYear}-03-31`,
  };
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [activeYearId, setActiveYearId] = useState("");
  const [messageSignature, setMessageSignature] = useState("");
  const [lateCountsAsPresent, setLateCountsAsPresent] = useState(true);
  const [newYear, setNewYear] = useState(defaultNewYear);
  const [creatingYear, setCreatingYear] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useClientEffect(async (signal) => {
    const res = await fetch("/api/settings", { signal });
    if (!res.ok) {
      setMessage("Failed to load settings.");
      return;
    }

    const payload = await res.json();
    setData(payload);
    const active = payload.academic_years.find(
      (y: { is_active: boolean }) => y.is_active,
    );
    setActiveYearId(active?.id ?? payload.academic_years[0]?.id ?? "");
    setMessageSignature(payload.settings.message_signature);
    setLateCountsAsPresent(payload.settings.late_counts_as_present);
  }, []);

  async function reloadSettings() {
    const res = await fetch("/api/settings");
    if (!res.ok) {
      setMessage("Failed to load settings.");
      return;
    }

    const payload = await res.json();
    setData(payload);
    const active = payload.academic_years.find(
      (y: { is_active: boolean }) => y.is_active,
    );
    setActiveYearId(active?.id ?? payload.academic_years[0]?.id ?? "");
    setMessageSignature(payload.settings.message_signature);
    setLateCountsAsPresent(payload.settings.late_counts_as_present);
  }

  async function handleCreateYear(e: FormEvent) {
    e.preventDefault();
    setCreatingYear(true);
    setMessage("");

    const res = await fetch("/api/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newYear),
    });

    setCreatingYear(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload.error ?? "Failed to create academic year.");
      return;
    }

    setMessage("Academic year created.");
    setNewYear(defaultNewYear());
    await reloadSettings();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!activeYearId) {
      setMessage("Create an academic year before saving settings.");
      return;
    }

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
    if (res.ok) await reloadSettings();
  }

  const hasYears = (data?.academic_years.length ?? 0) > 0;

  return (
    <>
      <AppHeader title="Settings" backHref="/dashboard" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {!data ? (
          <p className="text-slate-600">Loading...</p>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateYear}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {hasYears ? "Add Academic Year" : "Create Academic Year"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {hasYears
                    ? "Add another year to switch between later."
                    : "Set up your first academic year to start using ClassTrack."}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Year Name
                </label>
                <input
                  value={newYear.name}
                  onChange={(e) =>
                    setNewYear((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="2026-2027"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newYear.start_date}
                    onChange={(e) =>
                      setNewYear((current) => ({
                        ...current,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newYear.end_date}
                    onChange={(e) =>
                      setNewYear((current) => ({
                        ...current,
                        end_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingYear}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {creatingYear ? "Creating..." : "Create Academic Year"}
              </button>
            </form>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Active Academic Year
                </label>
                {hasYears ? (
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
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    No academic years yet. Create one above first.
                  </p>
                )}
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
                App password is configured via the{" "}
                <code>APP_PASSWORD</code> environment variable.
              </div>

              {message && <p className="text-sm text-slate-700">{message}</p>}

              <button
                type="submit"
                disabled={saving || !hasYears}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
