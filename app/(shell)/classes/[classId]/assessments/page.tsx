import { notFound } from "next/navigation";
import AssessmentsPageClient from "@/components/assessments/assessments-page-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import { getClassById } from "@/lib/queries/classes";
import { getSyllabusSubjectsForClass } from "@/lib/queries/syllabus";
import { getAssessmentsForClass } from "@/lib/queries/assessments";

export const revalidate = 30;

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassAssessmentsPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const [subjects, assessments, students] = await Promise.all([
    getSyllabusSubjectsForClass(classId),
    getAssessmentsForClass(classId),
    prisma.student.findMany({
      where: { classId, isActive: true },
      orderBy: { rollNo: "asc" },
    }),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Assessments"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}`}
        backLabel="← Back to Class"
      />

      <AssessmentsPageClient
        classId={classId}
        initialSubjects={subjects}
        initialData={{ class_id: classId, assessments }}
        students={students.map((s) => ({
          id: s.id,
          roll_no: s.rollNo,
          full_name: s.fullName,
          admission_no: s.admissionNo,
          email: s.email,
          parent_phone: s.parentPhone,
          is_active: s.isActive,
        }))}
      />
    </PageContainer>
  );
}
