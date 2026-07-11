import { notFound } from "next/navigation";
import TeachingDiaryReportClient from "@/components/reports/teaching-diary-report-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getSyllabusSubjectsForClass } from "@/lib/queries/syllabus";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function TeachingDiaryReportPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const subjects = await getSyllabusSubjectsForClass(classId);

  return (
    <PageContainer>
      <PageHeader
        title="Teaching Diary Report"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/reports`}
        backLabel="← Back to Reports"
      />
      <TeachingDiaryReportClient classId={classId} subjects={subjects} />
    </PageContainer>
  );
}
