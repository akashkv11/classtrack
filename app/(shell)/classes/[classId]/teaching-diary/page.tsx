import { notFound } from "next/navigation";
import TeachingDiaryPageClient from "@/components/teaching-diary/teaching-diary-page-client";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getClassById } from "@/lib/queries/classes";
import { getSyllabusSubjectsForClass } from "@/lib/queries/syllabus";
import {
  computeDiarySummary,
  getTaughtSyllabusTopicIds,
  getTeachingDiaryEntriesForClass,
} from "@/lib/queries/teaching-diary";
import { matchSyllabusSubjectIdByName } from "@/lib/timetable/links";
import { getTimetableEntryById } from "@/lib/queries/timetable";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{
    timetable_entry_id?: string;
    date?: string;
    subject?: string;
    start_time?: string;
    end_time?: string;
    open_form?: string;
  }>;
};

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

export default async function TeachingDiaryPage({ params, searchParams }: PageProps) {
  const { classId } = await params;
  const query = await searchParams;
  const cls = await getClassById(classId);
  if (!cls) notFound();

  const subjects = await getSyllabusSubjectsForClass(classId);
  const { dateFrom, dateTo } = getThisMonthRange();
  const entries = await getTeachingDiaryEntriesForClass(classId, {
    dateFrom,
    dateTo,
  });
  const taughtTopicIds = await getTaughtSyllabusTopicIds(classId);

  let timetablePrefill: {
    timetable_entry_id?: string;
    entry_date: string;
    subject_name?: string;
    start_time?: string;
    end_time?: string;
    open_form?: boolean;
  } | null = null;

  if (query.timetable_entry_id) {
    const entry = await getTimetableEntryById(query.timetable_entry_id);
    if (entry && entry.class_id === classId) {
      timetablePrefill = {
        timetable_entry_id: entry.id,
        entry_date: query.date ?? entry.entry_date ?? new Date().toISOString().slice(0, 10),
        subject_name: query.subject ?? entry.subject,
        start_time: query.start_time ?? entry.start_time,
        end_time: query.end_time ?? entry.end_time,
        open_form: true,
      };
    }
  } else if (query.open_form === "1") {
    timetablePrefill = {
      entry_date: query.date ?? new Date().toISOString().slice(0, 10),
      subject_name: query.subject,
      start_time: query.start_time,
      end_time: query.end_time,
      open_form: true,
    };
  }

  const prefillSubjectId =
    timetablePrefill?.subject_name
      ? matchSyllabusSubjectIdByName(subjects, timetablePrefill.subject_name)
      : null;

  return (
    <PageContainer>
      <PageHeader
        title="Teaching Diary"
        subtitle={cls.displayName}
        backHref={`/classes/${classId}`}
        backLabel="← Back to Class"
      />

      <TeachingDiaryPageClient
        classId={classId}
        initialSubjects={subjects}
        initialData={{
          class_id: classId,
          entries,
          summary: computeDiarySummary(entries),
          taught_topic_ids: taughtTopicIds,
        }}
        timetablePrefill={
          timetablePrefill
            ? {
                ...timetablePrefill,
                syllabus_subject_id: prefillSubjectId,
              }
            : null
        }
      />
    </PageContainer>
  );
}
