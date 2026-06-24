"use client";

import { FormEvent, useState } from "react";
import FieldError from "@/components/FieldError";
import { useClientEffect } from "@/lib/use-client-effect";
import {
  academicYearSchema,
  FieldErrors,
  inputClassName,
  parseInput,
  settingsFormSchema,
} from "@/lib/validation";

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
  const [yearFieldErrors, setYearFieldErrors] = useState<FieldErrors>({});
  const [settingsFieldErrors, setSettingsFieldErrors] = useState<FieldErrors>({});

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
    setYearFieldErrors({});

    const parsed = parseInput(academicYearSchema, newYear);
    if (!parsed.success) {
      setYearFieldErrors(parsed.fieldErrors);
      setMessage(parsed.error);
      setCreatingYear(false);
      return;
    }

    const res = await fetch("/api/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setCreatingYear(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setMessage(payload.error ?? "Failed to create academic year.");
      if (payload.field_errors) {
        setYearFieldErrors(payload.field_errors);
      }
      return;
    }

    setMessage("Academic year created.");
    setNewYear(defaultNewYear());
    await reloadSettings();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setSettingsFieldErrors({});

    const parsed = parseInput(settingsFormSchema, {
      active_academic_year_id: activeYearId,
      message_signature: messageSignature,
      late_counts_as_present: lateCountsAsPresent,
    });

    if (!parsed.success) {
      setSettingsFieldErrors(parsed.fieldErrors);
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
        setSettingsFieldErrors(payload.field_errors);
      }
      return;
    }

    setMessage("Settings saved.");
    await reloadSettings();
  }

  const hasYears = (data?.academic_years.length ?? 0) > 0;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <div className="mt-8">
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
                  className={inputClassName(!!yearFieldErrors.name)}
                />
                <FieldError message={yearFieldErrors.name} />
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
                    className={inputClassName(!!yearFieldErrors.start_date)}
                  />
                  <FieldError message={yearFieldErrors.start_date} />
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
                    className={inputClassName(!!yearFieldErrors.end_date)}
                  />
                  <FieldError message={yearFieldErrors.end_date} />
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
                  <>
                    <select
                      value={activeYearId}
                      onChange={(e) => setActiveYearId(e.target.value)}
                      className={inputClassName(!!settingsFieldErrors.active_academic_year_id)}
                    >
                      {data.academic_years.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={settingsFieldErrors.active_academic_year_id} />
                  </>
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
                  className={inputClassName(!!settingsFieldErrors.message_signature)}
                />
                <FieldError message={settingsFieldErrors.message_signature} />
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
      </div>
    </main>
  );
}
