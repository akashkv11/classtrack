"use client";

import AssessmentMarkSheetView from "@/components/reports/assessment-mark-sheet-view";
import ReportHeader, { ReportFooter } from "@/components/reports/report-header";
import ReportPrintActions from "@/components/reports/report-print-actions";
import type { AssessmentMarksResponse } from "@/lib/types/assessment";
import type { ReportSettings } from "@/lib/types/settings";

type AssessmentMarkSheetClientProps = {
  data: AssessmentMarksResponse;
  reportSettings: ReportSettings;
  lowMarksThresholdPercent: number;
};

export default function AssessmentMarkSheetClient({
  data,
  reportSettings,
  lowMarksThresholdPercent,
}: AssessmentMarkSheetClientProps) {
  return (
    <>
      <div className="mb-6 print:hidden">
        <ReportPrintActions />
      </div>

      <div id="report-content">
        <ReportHeader
          settings={reportSettings}
          title="Assessment Mark Sheet"
          subtitle={`${data.assessment.name} · Max ${data.assessment.max_marks} marks`}
        />
        <AssessmentMarkSheetView
          data={data}
          lowMarksThresholdPercent={lowMarksThresholdPercent}
        />
        <ReportFooter settings={reportSettings} />
      </div>
    </>
  );
}
