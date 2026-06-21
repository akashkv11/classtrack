"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import FieldError from "@/components/FieldError";
import { todayISO } from "@/lib/dates";
import type { AttendanceStatus } from "@/lib/attendance";
import { useClientEffect } from "@/lib/use-client-effect";
import {
  attendanceSaveSchema,
  inputClassName,
  isoDateSchema,
  parseInput,
} from "@/lib/validation";

type RecordRow = {
  student_id: string;
  roll_no: number;
  full_name: string;
  status: AttendanceStatus;
};

export default function MarkAttendancePage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const classId = params.classId;

  const [className, setClassName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [initialRecords, setInitialRecords] = useState<RecordRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");

  const loadAttendance = async (signal?: AbortSignal) => {
    const dateParsed = parseInput(isoDateSchema, date);
    if (!dateParsed.success) {
      setDateError(dateParsed.error);
      setLoading(false);
      return;
    }

    setDateError("");
    setLoading(true);
    setError("");

    const [attendanceRes, classRes] = await Promise.all([
      fetch(`/api/classes/${classId}/attendance?date=${date}`, { signal }),
      fetch(`/api/classes/${classId}`, { signal }),
    ]);

    if (!attendanceRes.ok) {
      const payload = await attendanceRes.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load attendance.");
      setLoading(false);
      return;
    }

    const data = await attendanceRes.json();
    const cls = await classRes.json();
    setClassName(cls.display_name ?? "");
    setRecords(data.records ?? []);
    setInitialRecords(JSON.parse(JSON.stringify(data.records ?? [])));
    setSessionId(data.session?.id ?? null);
    setLoading(false);
  };

  useClientEffect((signal) => loadAttendance(signal), [classId, date]);

  const hasChanges = useMemo(
    () => JSON.stringify(records) !== JSON.stringify(initialRecords),
    [records, initialRecords],
  );

  function handleDateChange(value: string) {
    setDate(value);
    const parsed = parseInput(isoDateSchema, value);
    setDateError(parsed.success ? "" : parsed.error);
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)),
    );
  }

  function markAllPresent() {
    setRecords((prev) => prev.map((r) => ({ ...r, status: "present" as const })));
  }

  function resetChanges() {
    setRecords(JSON.parse(JSON.stringify(initialRecords)));
  }

  async function saveAttendance() {
    setSaving(true);
    setError("");

    const parsed = parseInput(attendanceSaveSchema, {
      attendance_date: date,
      notes: "",
      records: records.map((r) => ({
        student_id: r.student_id,
        status: r.status,
      })),
    });

    if (!parsed.success) {
      setError(parsed.error);
      if (parsed.fieldErrors.attendance_date) {
        setDateError(parsed.fieldErrors.attendance_date);
      }
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/classes/${classId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save attendance");
      }

      router.push(`/classes/${classId}/summary/${data.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader
        title="Mark Attendance"
        subtitle={className}
        backHref={`/classes/${classId}`}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={inputClassName(!!dateError, "")}
            />
            <FieldError message={dateError} />
          </div>
          {sessionId && (
            <p className="text-sm text-green-700">Existing attendance loaded for editing</p>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={markAllPresent}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Mark All Present
          </button>
          <button
            onClick={resetChanges}
            disabled={!hasChanges}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Reset Changes
          </button>
          <button
            onClick={saveAttendance}
            disabled={saving || records.length === 0 || !!dateError}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
          {sessionId && (
            <button
              onClick={() => router.push(`/classes/${classId}/summary/${sessionId}`)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              View Summary
            </button>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-slate-600">No active students in this class.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Roll No</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Present</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Absent</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Late</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.student_id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{record.roll_no}</td>
                    <td className="px-4 py-3">{record.full_name}</td>
                    {(["present", "absent", "late"] as const).map((status) => (
                      <td key={status} className="px-4 py-3">
                        <input
                          type="radio"
                          name={`status-${record.student_id}`}
                          checked={record.status === status}
                          onChange={() => setStatus(record.student_id, status)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
