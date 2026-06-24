"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AttendanceGrid, { isPresentStatus } from "@/components/attendance/attendance-grid";
import AttendanceToolbar from "@/components/attendance/attendance-toolbar";
import { useClass } from "@/components/classes/class-provider";
import Alert from "@/components/ui/alert";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import type { AttendanceRecordRow } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { useClientEffect } from "@/lib/use-client-effect";
import { attendanceSaveSchema, isoDateSchema, parseInput } from "@/lib/validation";

export default function MarkAttendancePage() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const classId = params.classId;
  const { displayName } = useClass();

  const [date, setDate] = useState(todayISO());
  const [records, setRecords] = useState<AttendanceRecordRow[]>([]);
  const [initialRecords, setInitialRecords] = useState<AttendanceRecordRow[]>([]);
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

    const attendanceRes = await fetch(`/api/classes/${classId}/attendance?date=${date}`, {
      signal,
    });

    if (!attendanceRes.ok) {
      const payload = await attendanceRes.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load attendance.");
      setLoading(false);
      return;
    }

    const data = await attendanceRes.json();
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
    <PageContainer>
      <PageHeader
        title="Mark Attendance"
        subtitle={displayName}
        backHref={`/classes/${classId}`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <FormField label="Date" error={dateError}>
          <TextInput
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            error={!!dateError}
            className="w-full sm:w-auto"
          />
        </FormField>
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

      <AttendanceToolbar
        classId={classId}
        sessionId={sessionId}
        saving={saving}
        hasChanges={hasChanges}
        canSave={records.length > 0 && !dateError}
        onMarkAllPresent={markAllPresent}
        onMarkAllAbsent={markAllAbsent}
        onReset={resetChanges}
        onSave={saveAttendance}
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingState />
      ) : records.length === 0 ? (
        <EmptyState message="No active students in this class." />
      ) : (
        <AttendanceGrid records={records} onToggle={toggleStudent} />
      )}
    </PageContainer>
  );
}
