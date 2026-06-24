"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useClass } from "@/components/classes/class-provider";
import ClassSettingsForm from "@/components/settings/class-settings-form";
import LoadingState from "@/components/ui/loading-state";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import type { ClassSummary } from "@/lib/types";
import { useClientEffect } from "@/lib/use-client-effect";

export default function ClassSettingsPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const { displayName } = useClass();

  const [data, setData] = useState<ClassSummary | null>(null);

  async function loadData(signal?: AbortSignal) {
    const res = await fetch(`/api/classes/${classId}`, { signal });
    setData(await res.json());
  }

  useClientEffect((signal) => loadData(signal), [classId]);

  return (
    <PageContainer size="md">
      <PageHeader
        title="Class Settings"
        subtitle={displayName}
        backHref={`/classes/${classId}`}
      />

      {!data ? (
        <LoadingState />
      ) : (
        <ClassSettingsForm classId={classId} initialData={data} onSaved={() => loadData()} />
      )}
    </PageContainer>
  );
}
