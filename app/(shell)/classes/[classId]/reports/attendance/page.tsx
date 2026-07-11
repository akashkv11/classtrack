import { notFound } from "next/navigation";
import AttendanceReportClient from "@/components/reports/attendance-report-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getReportSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function AttendanceReportPage({ params }: PageProps) {
  const { classId } = await params;
  const [cls, reportSettings] = await Promise.all([
    getClassById(classId),
    getReportSettings(),
  ]);
  if (!cls) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Report"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/reports`}
        backLabel="← Back to Reports"
      />
      <AttendanceReportClient classId={classId} reportSettings={reportSettings} />
    </PageContainer>
  );
}
