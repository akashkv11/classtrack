import { notFound } from "next/navigation";
import AssessmentDetailClient from "@/components/assessments/assessment-detail-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getAssessmentMarksGrid } from "@/lib/queries/assessments";
import { getLowMarksThresholdPercent } from "@/lib/settings";

export const revalidate = 30;

type PageProps = {
  params: Promise<{ classId: string; assessmentId: string }>;
};

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { classId, assessmentId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const [data, lowMarksThresholdPercent] = await Promise.all([
    getAssessmentMarksGrid(assessmentId, classId),
    getLowMarksThresholdPercent(),
  ]);
  if (!data) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={data.assessment.name}
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/assessments`}
        backLabel="← Back to Assessments"
      />

      <AssessmentDetailClient
        classId={classId}
        assessmentId={assessmentId}
        initialData={data}
        lowMarksThresholdPercent={lowMarksThresholdPercent}
      />
    </PageContainer>
  );
}
