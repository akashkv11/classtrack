import { notFound } from "next/navigation";
import StudentProfileList from "@/components/student-profile/student-profile-list";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getStudentsForProfileList } from "@/lib/queries/student-profile";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassStudentNotesPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const students = await getStudentsForProfileList(classId);

  return (
    <PageContainer>
      <PageHeader
        title="Student Notes"
        subtitle={cls.displayName}
        backHref="/student-notes"
        backLabel="← Back to Student Notes"
      />

      <p className="mb-6 text-sm text-slate-600">
        Select a student to view or add notes.
      </p>

      <StudentProfileList
        classId={classId}
        students={students}
        studentHref={(id) => `/classes/${classId}/students/${id}#student-notes`}
        emptyMessage="No active students in this class. Add students before recording notes."
      />
    </PageContainer>
  );
}
