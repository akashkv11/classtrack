import { notFound } from "next/navigation";
import StudentProfileReportClient from "@/components/reports/student-profile-report-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { prisma } from "@/lib/db";
import { getReportSettings } from "@/lib/settings";

export const revalidate = 30;

type PageProps = { params: Promise<{ classId: string }> };

export default async function StudentProfileReportPage({ params }: PageProps) {
  const { classId } = await params;
  const [cls, students, reportSettings] = await Promise.all([
    getClassById(classId),
    prisma.student.findMany({ where: { classId }, orderBy: [{ rollNo: "asc" }, { fullName: "asc" }], select: { id: true, rollNo: true, fullName: true, isActive: true } }),
    getReportSettings(),
  ]);
  if (!cls) notFound();

  return (
    <PageContainer>
      <div className="print:hidden">
        <PageHeader
          title="Student Profile Report"
          subtitle={cls.displayName}
          backHref={`/classes/${classId}/reports`}
          backLabel="← Back to Reports"
        />
      </div>
      <StudentProfileReportClient
        classId={classId}
        students={students.map(s => ({ id: s.id, roll_no: s.rollNo, full_name: s.fullName, is_active: s.isActive }))}
        reportSettings={reportSettings}
      />
    </PageContainer>
  );
}
