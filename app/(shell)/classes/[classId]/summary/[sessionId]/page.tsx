"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClass } from "@/components/classes/class-provider";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { Button, ButtonLink } from "@/components/ui/button";
import Card, { StatCard } from "@/components/ui/card";
import LoadingState, { EmptyState } from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import WhatsAppNumberForm from "@/components/whatsapp/whatsapp-number-form";
import WhatsAppPreview from "@/components/whatsapp/whatsapp-preview";
import { useWhatsAppMessage } from "@/components/whatsapp/use-whatsapp-message";
import type { AttendanceSummary } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";

export default function AttendanceSummaryPage() {
  const params = useParams<{ classId: string; sessionId: string }>();
  const { classId, sessionId } = params;
  const { displayName } = useClass();

  const [data, setData] = useState<AttendanceSummary | null>(null);
  const { open, loading, error, data: whatsappData, openPreview, closePreview } =
    useWhatsAppMessage();

  async function loadSummary(signal?: AbortSignal) {
    const res = await fetch(`/api/attendance-sessions/${sessionId}/summary`, { signal });
    setData(await res.json());
  }

  useClientEffect((signal) => loadSummary(signal), [sessionId]);

  if (!data) {
    return (
      <PageContainer>
        <PageHeader title="Attendance Summary" backHref={`/classes/${classId}`} />
        <LoadingState />
      </PageContainer>
    );
  }

  const hasWhatsApp = Boolean(data.class.whatsapp_number);

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

      <ActionBar>
        <Button
          variant="whatsapp"
          className={actionButtonClassName}
          onClick={() => openPreview(sessionId)}
          disabled={!hasWhatsApp || loading}
        >
          {loading ? "Loading..." : "Send WhatsApp Message"}
        </Button>
        {error && <p className="w-full text-sm text-red-700">{error}</p>}
        <ButtonLink
          href={`/classes/${classId}/attendance`}
          variant="secondary"
          className={actionButtonClassName}
        >
          Edit Attendance
        </ButtonLink>
        <ButtonLink href="/classes" variant="secondary" className={actionButtonClassName}>
          Back to Classes
        </ButtonLink>
      </ActionBar>

      <WhatsAppPreview
        open={open}
        phoneNumber={whatsappData.phone_number}
        message={whatsappData.message}
        whatsappUrl={whatsappData.whatsapp_url}
        onClose={closePreview}
      />
    </PageContainer>
  );
}
