"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SectionCard from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput } from "@/components/ui/form-field";
import { REPORT_TYPES, type ReportTypeId } from "@/lib/reports/constants";

type ReportsExportClientProps = {
  classes: { id: string; display_name: string }[];
};

export default function ReportsExportClient({ classes }: ReportsExportClientProps) {
  const router = useRouter();
  const [reportType, setReportType] = useState<ReportTypeId>(REPORT_TYPES[0].id);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");

  function handlePreview() {
    const type = REPORT_TYPES.find((item) => item.id === reportType);
    if (!type || !classId) return;
    router.push(type.path(classId));
  }

  return (
    <SectionCard
      title="Export a Report"
      description="Choose a report type and class, then preview before printing or saving as PDF."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Report Type">
          <SelectInput
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportTypeId)}
          >
            {REPORT_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Class">
          <SelectInput
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">No classes</option>
            ) : (
              classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.display_name}
                </option>
              ))
            )}
          </SelectInput>
        </FormField>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        {REPORT_TYPES.find((type) => type.id === reportType)?.description}
      </p>

      <div className="mt-6">
        <Button type="button" onClick={handlePreview} disabled={!classId}>
          Preview Report
        </Button>
      </div>
    </SectionCard>
  );
}
