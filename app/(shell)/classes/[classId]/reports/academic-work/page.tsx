import { notFound } from "next/navigation";
import AcademicWorkReportClient from "@/components/reports/academic-work-report-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getSyllabusSubjectsForClass } from "@/lib/queries/syllabus";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function AcademicWorkReportPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const subjects = await getSyllabusSubjectsForClass(classId);

  return (
    <PageContainer>
      <PageHeader
        title="Monthly Academic Work Report"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/reports`}
        backLabel="← Back to Reports"
      />
      <AcademicWorkReportClient classId={classId} subjects={subjects} />
    </PageContainer>
  );
}
