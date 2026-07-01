import { notFound } from "next/navigation";
import TeachingDiaryPageClient from "@/components/teaching-diary/teaching-diary-page-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getSyllabusSubjectsForClass } from "@/lib/queries/syllabus";
import {
  computeDiarySummary,
  getTeachingDiaryEntriesForClass,
} from "@/lib/queries/teaching-diary";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ classId: string }> };

function getThisMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

export default async function TeachingDiaryPage({ params }: PageProps) {
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const subjects = await getSyllabusSubjectsForClass(classId);
  const { dateFrom, dateTo } = getThisMonthRange();
  const entries = await getTeachingDiaryEntriesForClass(classId, {
    dateFrom,
    dateTo,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Teaching Diary"
        subtitle={cls.displayName}
        backHref="/teaching-diary"
        backLabel="← Back to Teaching Diary"
      />

      <TeachingDiaryPageClient
        classId={classId}
        initialSubjects={subjects}
        initialData={{
          class_id: classId,
          entries,
          summary: computeDiarySummary(entries),
        }}
      />
    </PageContainer>
  );
}
