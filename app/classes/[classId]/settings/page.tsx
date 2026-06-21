"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";

type ClassData = {
  display_name: string;
  whatsapp_number: string | null;
  is_active: boolean;
};

export default function ClassSettingsPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;

  const [data, setData] = useState<ClassData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/classes/${classId}`);
    const cls = await res.json();
    setData(cls);
    setDisplayName(cls.display_name ?? "");
    setWhatsappNumber(cls.whatsapp_number ?? "");
    setIsActive(cls.is_active ?? true);
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        whatsapp_number: whatsappNumber,
        is_active: isActive,
      }),
    });

    setSaving(false);
    setMessage(res.ok ? "Changes saved." : "Failed to save changes.");
    if (res.ok) await loadData();
  }

  if (!data) {
    return (
      <>
        <AppHeader title="Class Settings" backHref={`/classes/${classId}`} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <p className="text-slate-600">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Class Settings" backHref={`/classes/${classId}`} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Class Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              WhatsApp Number
            </label>
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="91XXXXXXXXXX"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              Format: country code + number, no + or spaces
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          {message && <p className="text-sm text-slate-700">{message}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </main>
    </>
  );
}
