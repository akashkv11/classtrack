import { notFound } from "next/navigation";
import StudentProfileReportClient from "@/components/reports/student-profile-report-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getStudentsForProfileList } from "@/lib/queries/student-profile";
import { getReportSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function StudentProfileReportPage({ params }: PageProps) {
  const { classId } = await params;
  const [cls, students, reportSettings] = await Promise.all([
    getClassById(classId),
    getStudentsForProfileList(classId),
    getReportSettings(),
  ]);
  if (!cls) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Student Profile Report"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/reports`}
        backLabel="← Back to Reports"
      />
      <StudentProfileReportClient
        classId={classId}
        students={students}
        reportSettings={reportSettings}
      />
    </PageContainer>
  );
}
