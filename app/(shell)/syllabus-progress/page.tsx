import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import SyllabusClassCard from "@/components/syllabus/syllabus-class-card";
import { SyllabusProgressBar } from "@/components/syllabus/syllabus-progress-bar";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getSyllabusOverviewForActiveYear } from "@/lib/queries/syllabus";

export const dynamic = "force-dynamic";

export default async function SyllabusProgressPage() {
  const { activeYear, classes } = await getSyllabusOverviewForActiveYear();

  const withSyllabus = classes.filter((c) => c.subjects_count > 0);
  const totalTopics = classes.reduce((sum, c) => sum + c.topics_count, 0);
  const totalCompleted = withSyllabus.reduce(
    (sum, overview) =>
      sum +
      overview.subjects.reduce(
        (subjectSum, subject) => subjectSum + subject.completed_topics_count,
        0,
      ),
    0,
  );
  const avgProgress =
    withSyllabus.length === 0
      ? 0
      : Math.round(
          withSyllabus.reduce((sum, c) => sum + c.progress_percentage, 0) /
            withSyllabus.length,
        );

  return (
    <PageContainer>
      <PageHeader
        title="Syllabus Progress"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Track syllabus coverage by class`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withSyllabus.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Average progress</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{avgProgress}%</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    {withSyllabus.length} classes · {totalTopics} topics
                  </div>
                </div>
                <SyllabusProgressBar
                  breakdown={{
                    total: totalTopics,
                    not_started: Math.max(totalTopics - totalCompleted, 0),
                    in_progress: 0,
                    completed: totalCompleted,
                    revised: 0,
                    skipped: 0,
                    progress_percentage: avgProgress,
                  }}
                  size="md"
                  showPercentage={false}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <SyllabusClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
