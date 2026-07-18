"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AttendanceGrid from "@/components/attendance/attendance-grid";
import AttendanceToolbar from "@/components/attendance/attendance-toolbar";
import { useClass } from "@/components/classes/class-provider";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import FormField, { TextInput } from "@/components/ui/form-field";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { formatTime12h } from "@/lib/timetable";
import { buildAttendanceLink } from "@/lib/timetable/links";
import type { AttendanceRecordRow, AttendanceSessionOnDate } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { useClientEffect } from "@/lib/use-client-effect";
import { attendanceSaveSchema, isoDateSchema, parseInput } from "@/lib/validation";

function sessionPeriodLabel(session: AttendanceSessionOnDate): string {
  if (session.timetable_subject) {
    const time =
      session.timetable_start_time && session.timetable_end_time
        ? ` · ${formatTime12h(session.timetable_start_time)} – ${formatTime12h(session.timetable_end_time)}`
        : "";
    return `${session.timetable_subject}${time}`;
  }
  return "No period linked";
}

export default function MarkAttendancePage() {
  const params = useParams<{ classId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = params.classId;
  const { displayName } = useClass();

  const timetableEntryId = searchParams.get("timetable_entry_id");
  const timetableSubject = searchParams.get("subject");
  const timetableStartTime = searchParams.get("start_time");
  const timetableEndTime = searchParams.get("end_time");
  const initialDate = searchParams.get("date") ?? todayISO();

  const [date, setDate] = useState(initialDate);
  const [records, setRecords] = useState<AttendanceRecordRow[]>([]);
  const [initialRecords, setInitialRecords] = useState<AttendanceRecordRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionsOnDate, setSessionsOnDate] = useState<AttendanceSessionOnDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionOnDate | null>(
    null,
  );
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

    const params = new URLSearchParams({ date });
    if (timetableEntryId) {
      params.set("timetable_entry_id", timetableEntryId);
    }

    const attendanceRes = await fetch(
      `/api/classes/${classId}/attendance?${params.toString()}`,
      { signal },
    );

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
    setSessionsOnDate(data.sessions_on_date ?? []);
    setLoading(false);
  };

  useClientEffect((signal) => loadAttendance(signal), [classId, date, timetableEntryId]);

  const presentCount = useMemo(
    () => records.filter((r) => r.status === "present").length,
    [records],
  );
  const lateCount = useMemo(
    () => records.filter((r) => r.status === "late").length,
    [records],
  );
  const absentCount = useMemo(
    () => records.filter((r) => r.status === "absent").length,
    [records],
  );

  const hasChanges = useMemo(
    () => JSON.stringify(records) !== JSON.stringify(initialRecords),
    [records, initialRecords],
  );

  const hasMultipleSessions = sessionsOnDate.length > 1;

  function handleDateChange(value: string) {
    setDate(value);
    const parsed = parseInput(isoDateSchema, value);
    setDateError(parsed.success ? "" : parsed.error);
  }

  function toggleStudent(studentId: string) {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.student_id !== studentId) return r;
        if (r.status === "absent") return { ...r, status: "present" };
        if (r.status === "present") return { ...r, status: "absent" };
        return { ...r, status: "present" };
      }),
    );
  }

  function markStudentLate(studentId: string) {
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status: "late" } : r)),
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
      timetable_entry_id: timetableEntryId,
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

  async function confirmDeleteSession() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance-sessions/${deleteTarget.id}/summary`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to delete attendance");
      }

      const deletedCurrent = deleteTarget.id === sessionId;
      setDeleteTarget(null);

      if (deletedCurrent) {
        setSessionId(null);
        setInitialRecords(
          records.map((r) => ({ ...r, status: "absent" as const })),
        );
        setRecords((prev) => prev.map((r) => ({ ...r, status: "absent" as const })));
      }

      await loadAttendance();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete attendance");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Mark Attendance"
        subtitle={displayName}
        backHref={`/classes/${classId}`}
      />

      {timetableEntryId && (
        <Alert variant="info" className="mb-4">
          Marking attendance for today&apos;s scheduled class
          {timetableSubject ? ` · ${timetableSubject}` : ""}
          {timetableStartTime && timetableEndTime
            ? ` · ${formatTime12h(timetableStartTime)} – ${formatTime12h(timetableEndTime)}`
            : ""}
          .
        </Alert>
      )}

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

      {sessionsOnDate.length > 0 && (
        <Card className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            {hasMultipleSessions
              ? `Sessions on this date (${sessionsOnDate.length})`
              : "Session on this date"}
          </h2>
          {hasMultipleSessions && (
            <p className="mb-3 text-sm text-slate-600">
              Multiple attendance records exist for this date. Delete any duplicates you
              do not need.
            </p>
          )}
          <ul className="space-y-2">
            {sessionsOnDate.map((session) => {
              const isCurrent = session.id === sessionId;
              return (
                <li
                  key={session.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-slate-900">
                      {sessionPeriodLabel(session)}
                      {isCurrent ? (
                        <span className="ml-2 text-xs font-normal text-blue-700">
                          (current)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-slate-500">{session.record_count} records</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildAttendanceLink(classId, {
                        date: session.attendance_date,
                        timetableEntryId: session.timetable_entry_id ?? undefined,
                        subject: session.timetable_subject ?? undefined,
                        startTime: session.timetable_start_time ?? undefined,
                        endTime: session.timetable_end_time ?? undefined,
                      })}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open
                    </Link>
                    <Link
                      href={`/classes/${classId}/summary/${session.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Summary
                    </Link>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(session)}
                      disabled={deleting}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {!loading && records.length > 0 && (
        <p className="mb-4 text-sm text-slate-600">
          <span className="font-medium text-green-700">{presentCount} present</span>
          {" · "}
          <span className="font-medium text-amber-700">{lateCount} late</span>
          {" · "}
          <span className="font-medium text-red-700">{absentCount} absent</span>
          {" · "}
          Tap a student for present/absent. Tap <span className="font-semibold text-amber-700">L</span> for
          late.
        </p>
      )}

      <AttendanceToolbar
        classId={classId}
        sessionId={sessionId}
        saving={saving}
        deleting={deleting}
        hasChanges={hasChanges}
        canSave={records.length > 0 && !dateError}
        onMarkAllPresent={markAllPresent}
        onMarkAllAbsent={markAllAbsent}
        onReset={resetChanges}
        onSave={saveAttendance}
        onDelete={
          sessionId
            ? () => {
                const current =
                  sessionsOnDate.find((s) => s.id === sessionId) ??
                  ({
                    id: sessionId,
                    attendance_date: date,
                    timetable_entry_id: timetableEntryId,
                    timetable_subject: timetableSubject,
                    timetable_start_time: timetableStartTime,
                    timetable_end_time: timetableEndTime,
                    record_count: records.length,
                    created_at: "",
                  } satisfies AttendanceSessionOnDate);
                setDeleteTarget(current);
              }
            : undefined
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingState />
      ) : records.length === 0 ? (
        <EmptyState message="No active students in this class." />
      ) : (
        <AttendanceGrid
          records={records}
          onToggle={toggleStudent}
          onMarkLate={markStudentLate}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete attendance?"
        description={
          deleteTarget
            ? `This will permanently delete attendance for ${sessionPeriodLabel(deleteTarget)} on ${deleteTarget.attendance_date}. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDeleteSession}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </PageContainer>
  );
}
