import { notFound } from "next/navigation";
import StudentProfileView from "@/components/student-profile/student-profile-view";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getStudentProfile } from "@/lib/queries/student-profile";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ classId: string; studentId: string }>;
};

export default async function StudentProfilePage({ params }: PageProps) {
  const { classId, studentId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const profile = await getStudentProfile(classId, studentId);
  if (!profile) notFound();

  return (
    <PageContainer>
      <PageHeader
        title="Student Profile"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}/students`}
        backLabel="← Back to Students"
      />

      <StudentProfileView profile={profile} />
    </PageContainer>
  );
}
