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

function isPresentStatus(status: AttendanceStatus): boolean {
  return status === "present" || status === "late";
}

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

  const presentCount = useMemo(
    () => records.filter((r) => isPresentStatus(r.status)).length,
    [records],
  );
  const absentCount = records.length - presentCount;

  const hasChanges = useMemo(
    () => JSON.stringify(records) !== JSON.stringify(initialRecords),
    [records, initialRecords],
  );

  function handleDateChange(value: string) {
    setDate(value);
    const parsed = parseInput(isoDateSchema, value);
    setDateError(parsed.success ? "" : parsed.error);
  }

  function toggleStudent(studentId: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? { ...r, status: isPresentStatus(r.status) ? "absent" : "present" }
          : r,
      ),
    );
  }

  function markAllPresent() {
    setRecords((prev) => prev.map((r) => ({ ...r, status: "present" as const })));
  }

  function markAllAbsent() {
    setRecords((prev) => prev.map((r) => ({ ...r, status: "absent" as const })));
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
        status: isPresentStatus(r.status) ? "present" : "absent",
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

        {!loading && records.length > 0 && (
          <p className="mb-4 text-sm text-slate-600">
            <span className="font-medium text-green-700">{presentCount} present</span>
            {" · "}
            <span className="font-medium text-red-700">{absentCount} absent</span>
            {" · "}
            Tap a student to mark present. Tap again to mark absent.
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={markAllPresent}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Mark All Absent
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
          <ul className="grid gap-2 sm:grid-cols-2">
            {records.map((record) => {
              const present = isPresentStatus(record.status);
              return (
                <li key={record.student_id}>
                  <button
                    type="button"
                    onClick={() => toggleStudent(record.student_id)}
                    aria-pressed={present}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                      present
                        ? "border-green-500 bg-green-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        present
                          ? "bg-green-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {record.roll_no}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm ${
                          present ? "font-semibold text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {record.full_name}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs font-medium ${
                          present ? "text-green-700" : "text-slate-500"
                        }`}
                      >
                        {present ? "Present · tap to mark absent" : "Absent · tap to mark present"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
