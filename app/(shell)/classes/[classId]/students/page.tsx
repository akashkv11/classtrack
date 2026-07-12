import { notFound } from "next/navigation";
import StudentsSection from "@/components/students/students-section";
import StudentProfileList from "@/components/student-profile/student-profile-list";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import { getClassById } from "@/lib/queries/classes";
import { getStudentsForProfileList } from "@/lib/queries/student-profile";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassStudentsPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const students = await getStudentsForProfileList(classId);

  return (
    <PageContainer>
      <PageHeader
        title="Students"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}`}
        backLabel="← Back to Class"
      />

      <StudentsSection classId={classId} showTitle={false} />

      <SectionCard title="Student Profiles" className="mt-8">
        <p className="mb-4 text-sm text-slate-600">
          Select a student to view their full profile.
        </p>
        <StudentProfileList classId={classId} students={students} />
      </SectionCard>
    </PageContainer>
  );
}
