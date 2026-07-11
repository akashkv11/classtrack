import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import ReportsClassCard from "@/components/reports/reports-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getReportsOverviewForActiveYear } from "@/lib/queries/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { activeYear, classes } = await getReportsOverviewForActiveYear();

  const withData = classes.filter(
    (c) => c.syllabus_subjects_count > 0 || c.diary_entries_count > 0,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · View class-level academic reports`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withData.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with data</p>
                <p className="text-2xl font-bold text-slate-900">{withData.length}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <ReportsClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
