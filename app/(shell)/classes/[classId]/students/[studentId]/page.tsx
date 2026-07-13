import { notFound } from "next/navigation";
import StudentNotesSection from "@/components/student-notes/student-notes-section";
import ParentCommunicationsSection from "@/components/parent-communication/parent-communications-section";
import StudentProfileView from "@/components/student-profile/student-profile-view";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getStudentProfile } from "@/lib/queries/student-profile";
import { getStudentNotes } from "@/lib/queries/student-notes";
import {
  getParentCommunications,
  getStudentNoteOptions,
} from "@/lib/queries/parent-communications";

export const revalidate = 30;

type PageProps = {
  params: Promise<{ classId: string; studentId: string }>;
};

export default async function StudentProfilePage({ params }: PageProps) {
  const { classId, studentId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const [profile, notes, communications, noteOptions] = await Promise.all([
    getStudentProfile(classId, studentId),
    getStudentNotes(classId, studentId),
    getParentCommunications(classId, studentId),
    getStudentNoteOptions(classId, studentId),
  ]);
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

      <StudentNotesSection
        classId={classId}
        studentId={studentId}
        initialNotes={notes}
      />

      <ParentCommunicationsSection
        classId={classId}
        studentId={studentId}
        initialCommunications={communications}
        noteOptions={noteOptions}
      />
    </PageContainer>
  );
}
