import { notFound } from "next/navigation";
import SyllabusPageClient from "@/components/syllabus/syllabus-page-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import {
  getSyllabusSubjectDetail,
  getSyllabusSubjectsForClass,
} from "@/lib/queries/syllabus";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

export default async function SyllabusPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const subjects = await getSyllabusSubjectsForClass(classId);
  const firstSubject = subjects[0];
  const subjectDetail = firstSubject
    ? await getSyllabusSubjectDetail(firstSubject.id)
    : null;

  return (
    <PageContainer>
      <PageHeader
        title="Syllabus Progress"
        subtitle={`${cls.displayName}${subjectDetail ? ` · ${subjectDetail.subject_name}` : ""}`}
        backHref={`/classes/${classId}`}
        backLabel="← Back to Class"
      />

      <SyllabusPageClient
        classId={classId}
        initialSubjects={subjects}
        initialSubjectDetail={subjectDetail}
      />
    </PageContainer>
  );
}
