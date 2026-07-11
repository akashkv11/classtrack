import { notFound } from "next/navigation";
import AssessmentMarkSheetClient from "@/components/reports/assessment-mark-sheet-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getAssessmentMarksGrid } from "@/lib/queries/assessments";
import { getLowMarksThresholdPercent, getReportSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ classId: string; assessmentId: string }>;
};

export default async function AssessmentMarkSheetReportPage({ params }: PageProps) {
  const { classId, assessmentId } = await params;
  const [cls, data, reportSettings, lowMarksThreshold] = await Promise.all([
    getClassById(classId),
    getAssessmentMarksGrid(assessmentId, classId),
    getReportSettings(),
    getLowMarksThresholdPercent(),
  ]);
  if (!cls || !data) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Assessment Mark Sheet"
        subtitle={`${cls.displayName} · ${data.assessment.name}`}
        backHref={`/classes/${classId}/reports/assessments`}
        backLabel="← Back to Assessments Report"
      />
      <AssessmentMarkSheetClient
        data={data}
        reportSettings={reportSettings}
        lowMarksThresholdPercent={lowMarksThreshold}
      />
    </PageContainer>
  );
}
