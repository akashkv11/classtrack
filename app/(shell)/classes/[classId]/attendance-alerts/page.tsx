import { notFound } from "next/navigation";
import AttendanceAlertsClient from "@/components/attendance-alerts/attendance-alerts-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";

export const revalidate = 30;

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassAttendanceAlertsPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Alerts"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}`}
        backLabel="← Back to Class"
      />

      <p className="mb-6 text-sm text-slate-600">
        Students flagged for continuous absence, low attendance, or frequent absences.
      </p>

      <AttendanceAlertsClient classId={classId} />
    </PageContainer>
  );
}
