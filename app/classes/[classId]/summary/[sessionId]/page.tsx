"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import WhatsAppPreview from "@/components/WhatsAppPreview";

type Summary = {
  session_id: string;
  class: { id: string; display_name: string };
  attendance_date: string;
  summary: { total: number; present: number; absent: number; late: number };
  absentees: { roll_no: number; full_name: string }[];
  late_students: { roll_no: number; full_name: string }[];
};

export default function AttendanceSummaryPage() {
  const params = useParams<{ classId: string; sessionId: string }>();
  const { classId, sessionId } = params;

  const [data, setData] = useState<Summary | null>(null);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappData, setWhatsappData] = useState({
    phone_number: "",
    message: "",
    whatsapp_url: "",
  });

  const loadSummary = useCallback(async () => {
    const res = await fetch(`/api/attendance-sessions/${sessionId}/summary`);
    setData(await res.json());
  }, [sessionId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function openWhatsAppPreview() {
    const res = await fetch(`/api/attendance-sessions/${sessionId}/whatsapp-message`);
    const payload = await res.json();
    if (!res.ok) {
      alert(payload.error ?? "Could not generate WhatsApp message");
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

        <div className="flex flex-wrap gap-3">
          <button
            onClick={openWhatsAppPreview}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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
