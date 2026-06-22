"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import FieldError from "@/components/FieldError";
import WhatsAppPreview from "@/components/WhatsAppPreview";
import { useClientEffect } from "@/lib/use-client-effect";
import {
  classSettingsPatchSchema,
  FieldErrors,
  inputClassName,
  parseInput,
} from "@/lib/validation";

type Summary = {
  session_id: string;
  class: {
    id: string;
    display_name: string;
    whatsapp_number: string | null;
  };
  attendance_date: string;
  summary: { total: number; present: number; absent: number; late: number };
  absentees: { roll_no: number; full_name: string }[];
  late_students: { roll_no: number; full_name: string }[];
};

export default function AttendanceSummaryPage() {
  const params = useParams<{ classId: string; sessionId: string }>();
  const { classId, sessionId } = params;

  const [data, setData] = useState<Summary | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappFieldErrors, setWhatsappFieldErrors] = useState<FieldErrors>({});
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappData, setWhatsappData] = useState({
    phone_number: "",
    message: "",
    whatsapp_url: "",
  });

  async function loadSummary(signal?: AbortSignal) {
    const res = await fetch(`/api/attendance-sessions/${sessionId}/summary`, {
      signal,
    });
    const payload = await res.json();
    setData(payload);
    setWhatsappNumber(payload.class?.whatsapp_number ?? "");
  }

  useClientEffect((signal) => loadSummary(signal), [sessionId]);

  const hasWhatsApp = Boolean(data?.class.whatsapp_number);

  async function handleSaveWhatsApp(e: FormEvent) {
    e.preventDefault();
    setSavingWhatsApp(true);
    setWhatsappMessage("");
    setWhatsappFieldErrors({});

    const parsed = parseInput(classSettingsPatchSchema, {
      whatsapp_number: whatsappNumber,
    });

    if (!parsed.success) {
      setWhatsappFieldErrors(parsed.fieldErrors);
      setWhatsappMessage(parsed.error);
      setSavingWhatsApp(false);
      return;
    }

    const res = await fetch(`/api/classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setSavingWhatsApp(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setWhatsappMessage(payload.error ?? "Failed to save WhatsApp number.");
      if (payload.field_errors) {
        setWhatsappFieldErrors(payload.field_errors);
      }
      return;
    }

    setWhatsappMessage("WhatsApp number saved.");
    await loadSummary();
  }

  async function openWhatsAppPreview() {
    const res = await fetch(`/api/attendance-sessions/${sessionId}/whatsapp-message`);
    const payload = await res.json();
    if (!res.ok) {
      setWhatsappMessage(payload.error ?? "Could not generate WhatsApp message.");
      return;
    }
    setWhatsappData(payload);
    setWhatsappOpen(true);
  }

  if (!data) {
    return (
      <>
        <AppHeader title="Attendance Summary" backHref={`/classes/${classId}`} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <p className="text-slate-600">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="Attendance Summary"
        subtitle={`${data.class.display_name} · ${data.attendance_date}`}
        backHref={`/classes/${classId}`}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: data.summary.total },
            { label: "Present", value: data.summary.present },
            { label: "Absent", value: data.summary.absent },
            { label: "Late", value: data.summary.late },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-slate-600">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Absentees</h2>
            {data.absentees.length === 0 ? (
              <p className="text-sm text-slate-600">None</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.absentees.map((s) => (
                  <li key={s.roll_no}>
                    {s.roll_no}. {s.full_name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Late Students</h2>
            {data.late_students.length === 0 ? (
              <p className="text-sm text-slate-600">None</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.late_students.map((s) => (
                  <li key={s.roll_no}>
                    {s.roll_no}. {s.full_name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {!hasWhatsApp ? (
          <form
            onSubmit={handleSaveWhatsApp}
            className="mb-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <div>
              <h2 className="font-semibold text-amber-950">Set up WhatsApp</h2>
              <p className="mt-1 text-sm text-amber-900">
                Add the class WhatsApp group number to send the absentee message.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                WhatsApp Number
              </label>
              <input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="91XXXXXXXXXX"
                className={inputClassName(!!whatsappFieldErrors.whatsapp_number)}
              />
              <p className="mt-1 text-xs text-slate-600">
                Country code + number, no + or spaces (e.g. 91XXXXXXXXXX)
              </p>
              <FieldError message={whatsappFieldErrors.whatsapp_number} />
            </div>
            {whatsappMessage && (
              <p className="text-sm text-amber-950">{whatsappMessage}</p>
            )}
            <button
              type="submit"
              disabled={savingWhatsApp}
              className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-950 disabled:opacity-60"
            >
              {savingWhatsApp ? "Saving..." : "Save WhatsApp Number"}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-slate-600">
            WhatsApp: <span className="font-medium text-slate-900">{data.class.whatsapp_number}</span>
            {" · "}
            <Link
              href={`/classes/${classId}/settings`}
              className="text-blue-600 hover:underline"
            >
              Change in class settings
            </Link>
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openWhatsAppPreview}
            disabled={!hasWhatsApp}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send WhatsApp Message
          </button>
          <Link
            href={`/classes/${classId}/attendance`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit Attendance
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>

      <WhatsAppPreview
        open={whatsappOpen}
        phoneNumber={whatsappData.phone_number}
        message={whatsappData.message}
        whatsappUrl={whatsappData.whatsapp_url}
        onClose={() => setWhatsappOpen(false)}
      />
    </>
  );
}
