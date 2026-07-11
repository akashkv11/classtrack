import { notFound } from "next/navigation";
import ClassWorkspace from "@/components/classes/class-workspace";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { formatISODate } from "@/lib/dates";
import { getClassWorkspaceOverview } from "@/lib/queries/class-overview";
import { getClassDetail } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassDetailsPage({ params }: PageProps) {
  const { classId } = await params;

  const [cls, overview] = await Promise.all([
    getClassDetail(classId),
    getClassWorkspaceOverview(classId),
  ]);

  if (!cls || !overview) notFound();

  const sessions = cls.attendanceSessions.map((session) => ({
    id: session.id,
    date: formatISODate(session.attendanceDate),
  }));

  return (
    <PageContainer>
      <PageHeader
        title={cls.displayName}
        subtitle={`${cls.academicYear.name} · ${cls._count.students} students`}
        backHref="/classes"
        backLabel="← Back to Classes"
      />

      <ClassWorkspace classId={classId} overview={overview} sessions={sessions} />
    </PageContainer>
  );
}
