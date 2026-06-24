"use client";

import { useState } from "react";
import AcademicYearForm from "@/components/settings/academic-year-form";
import AppSettingsForm from "@/components/settings/app-settings-form";
import LoadingState from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import type { SettingsData } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [activeYearId, setActiveYearId] = useState("");
  const [messageSignature, setMessageSignature] = useState("");
  const [lateCountsAsPresent, setLateCountsAsPresent] = useState(true);

  async function reloadSettings(signal?: AbortSignal) {
    const res = await fetch("/api/settings", { signal });
    if (!res.ok) return;

    const payload = await res.json();
    setData(payload);
    const active = payload.academic_years.find(
      (y: { is_active: boolean }) => y.is_active,
    );
    setActiveYearId(active?.id ?? payload.academic_years[0]?.id ?? "");
    setMessageSignature(payload.settings.message_signature);
    setLateCountsAsPresent(payload.settings.late_counts_as_present);
  }

  useClientEffect((signal) => reloadSettings(signal), []);

  const hasYears = (data?.academic_years.length ?? 0) > 0;

  return (
    <PageContainer size="md">
      <PageHeader title="Settings" />

      {!data ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <AcademicYearForm hasYears={hasYears} onCreated={() => reloadSettings()} />
          <AppSettingsForm
            data={data}
            activeYearId={activeYearId}
            messageSignature={messageSignature}
            lateCountsAsPresent={lateCountsAsPresent}
            onActiveYearChange={setActiveYearId}
            onMessageSignatureChange={setMessageSignature}
            onLateCountsAsPresentChange={setLateCountsAsPresent}
            onSaved={() => reloadSettings()}
          />
        </div>
      )}
    </PageContainer>
  );
}
