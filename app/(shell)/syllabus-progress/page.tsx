import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import SyllabusClassCard from "@/components/syllabus/syllabus-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getSyllabusOverviewForActiveYear } from "@/lib/queries/syllabus";

export const dynamic = "force-dynamic";

export default async function SyllabusProgressPage() {
  const { activeYear, classes } = await getSyllabusOverviewForActiveYear();

  const withSyllabus = classes.filter((c) => c.subjects_count > 0);
  const totalTopics = classes.reduce((sum, c) => sum + c.topics_count, 0);
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
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with syllabus</p>
                <p className="text-2xl font-bold text-slate-900">{withSyllabus.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total topics</p>
                <p className="text-2xl font-bold text-slate-900">{totalTopics}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Average progress</p>
                <p className="text-2xl font-bold text-slate-900">{avgProgress}%</p>
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
