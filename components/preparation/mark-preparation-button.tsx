"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import PreparationRoster from "@/components/preparation/preparation-roster";
import type { PreparationStudent } from "@/lib/preparation";

export default function MarkPreparationButton({ classId, date, timetableEntryId, title, className, label = "Mark Preparation" }: {
  classId: string;
  date: string;
  timetableEntryId: string | null;
  title: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [students, setStudents] = useState<PreparationStudent[]>([]);
  const [rules, setRules] = useState({ threshold: 3, includePartial: false });
  const endpoint = `/api/classes/${classId}/preparation`;

  async function load() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const query = new URLSearchParams({ date });
      if (timetableEntryId) query.set("timetable_entry_id", timetableEntryId);
      const res = await fetch(`${endpoint}?${query}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load preparation.");
      setStudents(body.records.map((student: PreparationStudent) => ({
        ...student,
        preparation_status: student.preparation_status === "NOT_MARKED" ? "FULL" : student.preparation_status,
      })));
      setRules({ threshold: body.threshold, includePartial: body.includePartial });
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load preparation.");
    } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, timetable_entry_id: timetableEntryId, records: students.map((student) => ({
          student_id: student.student_id, preparation_status: student.preparation_status,
        })) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save preparation.");
      setOpen(false);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preparation.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className={className} onClick={load} disabled={busy}>
        {busy && !open ? "Loading..." : label}
      </Button>
      {saved && <p role="status" className="w-full text-sm text-green-700">Preparation saved.</p>}
      {error && !open && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
      <Modal open={open} title="Student Preparation" onClose={() => { if (!busy) setOpen(false); }} maxWidth="lg"
        footer={<div className={modalFooterClassName}>
          <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy || students.length === 0} onClick={save}>{busy ? "Saving..." : "Save Preparation"}</Button>
        </div>}
      >
        <p className="mb-4 text-sm font-medium text-slate-700">{title} · {date}</p>
        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
        <PreparationRoster students={students} onChange={setStudents} disabled={busy} {...rules} />
      </Modal>
    </>
  );
}
