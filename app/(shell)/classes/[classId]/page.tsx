import { notFound } from "next/navigation";
import ClassActions from "@/components/classes/class-actions";
import ClassDetailContent from "@/components/classes/class-detail-content";
import TodayAttendanceCard from "@/components/classes/today-attendance-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { formatISODate, todayISO } from "@/lib/dates";
import { getClassDetail } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassDetailsPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassDetail(classId);

  if (!cls) notFound();

  const today = todayISO();
  const todaySession = cls.attendanceSessions.find(
    (s) => formatISODate(s.attendanceDate) === today,
  );

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

      <TodayAttendanceCard
        classId={classId}
        marked={Boolean(todaySession)}
        sessionId={todaySession?.id}
      />

      <ClassActions classId={classId} />
      <ClassDetailContent classId={classId} sessions={sessions} />
    </PageContainer>
  );
}
