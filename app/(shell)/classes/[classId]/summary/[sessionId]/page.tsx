"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useClass } from "@/components/classes/class-provider";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import Alert from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import Card, { StatCard } from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import WhatsAppNumberForm from "@/components/whatsapp/whatsapp-number-form";
import WhatsAppPreview from "@/components/whatsapp/whatsapp-preview";
import WhatsAppMissingItemsDialog from "@/components/whatsapp/whatsapp-missing-items-dialog";
import { useWhatsAppMessage } from "@/components/whatsapp/use-whatsapp-message";
import type { AttendanceSummary } from "@/lib/types";
import { buildAttendanceLink } from "@/lib/timetable/links";
import { useClientEffect } from "@/lib/use-client-effect";

export default function AttendanceSummaryPage() {
  const params = useParams<{ classId: string; sessionId: string }>();
  const router = useRouter();
  const { classId, sessionId } = params;
  const { displayName } = useClass();

  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const {
    open,
    missingOpen,
    loading,
    error,
    data: whatsappData,
    openPreview,
    closePreview,
    confirmDespiteMissing,
    cancelMissingPrompt,
  } = useWhatsAppMessage();

  async function loadSummary(signal?: AbortSignal) {
    setLoadError("");
    const res = await fetch(`/api/attendance-sessions/${sessionId}/summary`, { signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(body.error ?? "Failed to load attendance summary");
      setData(null);
      return;
    }
    setData(body);
  }

  useClientEffect((signal) => loadSummary(signal), [sessionId]);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/attendance-sessions/${sessionId}/summary`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to delete attendance");
      }
      router.push(`/classes/${classId}/attendance`);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete attendance");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <PageContainer>
        <PageHeader title="Attendance Summary" backHref={`/classes/${classId}`} />
        <Alert variant="error">{loadError}</Alert>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <PageHeader title="Attendance Summary" backHref={`/classes/${classId}`} />
        <LoadingState />
      </PageContainer>
    );
  }

  const hasWhatsApp = Boolean(data.class.whatsapp_number);
  const editAttendanceHref = buildAttendanceLink(classId, {
    date: data.attendance_date,
    timetableEntryId: data.timetable_entry_id ?? undefined,
    subject: data.timetable_subject ?? undefined,
    startTime: data.timetable_start_time ?? undefined,
    endTime: data.timetable_end_time ?? undefined,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Summary"
        subtitle={`${displayName} · ${data.attendance_date}`}
        backHref={`/classes/${classId}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={data.summary.total} />
        <StatCard label="Present" value={data.summary.present} />
        <StatCard label="Absent" value={data.summary.absent} />
        <StatCard label="Late" value={data.summary.late} />
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Absentees</h2>
          {data.absentees.length === 0 ? (
            <EmptyState message="None" />
          ) : (
            <ul className="space-y-1 text-sm">
              {data.absentees.map((s) => (
                <li key={s.roll_no}>
                  {s.roll_no}. {s.full_name}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Late Students</h2>
          {data.late_students.length === 0 ? (
            <EmptyState message="None" />
          ) : (
            <ul className="space-y-1 text-sm">
              {data.late_students.map((s) => (
                <li key={s.roll_no}>
                  {s.roll_no}. {s.full_name}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {!hasWhatsApp ? (
        <WhatsAppNumberForm
          classId={classId}
          initialValue={data.class.whatsapp_number ?? ""}
          onSaved={() => loadSummary()}
        />
      ) : (
        <p className="mb-6 text-sm text-slate-600">
          WhatsApp:{" "}
          <span className="font-medium text-slate-900">{data.class.whatsapp_number}</span>
          {" · "}
          <Link href={`/classes/${classId}/settings`} className="text-blue-600 hover:underline">
            Change in class settings
          </Link>
        </p>
      )}

      {deleteError && <Alert variant="error" className="mb-4">{deleteError}</Alert>}

      <ActionBar>
        <Button
          variant="whatsapp"
          className={actionButtonClassName}
          onClick={() => openPreview(sessionId)}
          disabled={!hasWhatsApp || loading || deleting}
        >
          {loading ? "Loading..." : "Send WhatsApp Message"}
        </Button>
        {error && <p className="w-full text-sm text-red-700">{error}</p>}
        <ButtonLink
          href={editAttendanceHref}
          variant="secondary"
          className={actionButtonClassName}
        >
          Edit Attendance
        </ButtonLink>
        <Button
          variant="danger"
          className={actionButtonClassName}
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
        >
          Delete Attendance
        </Button>
        <ButtonLink href="/classes" variant="secondary" className={actionButtonClassName}>
          Back to Classes
        </ButtonLink>
      </ActionBar>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete attendance?"
        description={`This will permanently delete attendance for ${data.attendance_date}${
          data.timetable_subject ? ` (${data.timetable_subject})` : ""
        }. This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setConfirmDelete(false);
        }}
      />

      <WhatsAppMissingItemsDialog
        open={missingOpen}
        items={whatsappData.missing_items}
        onSendAnyway={confirmDespiteMissing}
        onClose={cancelMissingPrompt}
      />
      <WhatsAppPreview
        key={`${whatsappData.message}-${whatsappData.class_time ?? ""}`}
        open={open}
        phoneNumber={whatsappData.phone_number}
        message={whatsappData.message}
        whatsappUrl={whatsappData.whatsapp_url}
        classTime={whatsappData.class_time}
        onClose={closePreview}
      />
    </PageContainer>
  );
}
