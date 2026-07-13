import { notFound } from "next/navigation";
import AssessmentsReportClient from "@/components/reports/assessments-report-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getReportSettings } from "@/lib/settings";

export const revalidate = 30;

type PageProps = { params: Promise<{ classId: string }> };

export default async function AssessmentsReportPage({ params }: PageProps) {
  const { classId } = await params;
  const [cls, reportSettings] = await Promise.all([
    getClassById(classId),
    getReportSettings(),
  ]);
  if (!cls) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Assessment / Marks Report"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/reports`}
        backLabel="← Back to Reports"
      />
      <AssessmentsReportClient classId={classId} reportSettings={reportSettings} />
    </PageContainer>
  );
}
