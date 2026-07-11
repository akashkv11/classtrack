"use client";

import { useState } from "react";
import AcademicYearForm from "@/components/settings/academic-year-form";
import SettingsAcademicSection from "@/components/settings/settings-academic-section";
import SettingsAssessmentSection from "@/components/settings/settings-assessment-section";
import SettingsAttendanceSection from "@/components/settings/settings-attendance-section";
import SettingsCommunicationSection from "@/components/settings/settings-communication-section";
import SettingsReportSection from "@/components/settings/settings-report-section";
import Card from "@/components/ui/card";
import LoadingState from "@/components/ui/loading-state";
import type { SettingsData } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";

export default function SettingsPageClient() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [activeYearId, setActiveYearId] = useState("");
  const [settingsVersion, setSettingsVersion] = useState(0);

  async function reloadSettings(signal?: AbortSignal, bumpVersion = false) {
    const res = await fetch("/api/settings", { signal });
    if (!res.ok) return;

    const payload: SettingsData = await res.json();
    setData(payload);
    const active = payload.academic_years.find((year) => year.is_active);
    setActiveYearId(active?.id ?? payload.academic_years[0]?.id ?? "");
    if (bumpVersion) {
      setSettingsVersion((version) => version + 1);
    }
  }

  useClientEffect((signal) => reloadSettings(signal), []);

  const hasYears = (data?.academic_years.length ?? 0) > 0;

  if (!data) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <AcademicYearForm hasYears={hasYears} onCreated={() => reloadSettings()} />

      <SettingsAcademicSection
        data={data}
        activeYearId={activeYearId}
        onActiveYearChange={setActiveYearId}
        onSaved={() => reloadSettings()}
      />

      <SettingsAttendanceSection
        key={`attendance-${settingsVersion}`}
        settings={data.settings}
        onSaved={() => reloadSettings(undefined, true)}
      />

      <SettingsAssessmentSection
        key={`assessment-${settingsVersion}`}
        settings={data.settings}
        onSaved={() => reloadSettings(undefined, true)}
      />

      <SettingsReportSection
        key={`report-${settingsVersion}`}
        settings={data.settings}
        onSaved={() => reloadSettings(undefined, true)}
      />

      <SettingsCommunicationSection communication={data.communication} />

      <Card padding="lg">
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        <p className="mt-2 text-sm text-slate-600">
          App password is configured via the <code>APP_PASSWORD</code> environment variable.
        </p>
      </Card>
    </div>
  );
}
