import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import TeachingDiaryClassCard from "@/components/teaching-diary/teaching-diary-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getTeachingDiaryOverviewForActiveYear } from "@/lib/queries/teaching-diary";

export const dynamic = "force-dynamic";

export default async function TeachingDiaryPage() {
  const { activeYear, classes } = await getTeachingDiaryOverviewForActiveYear();

  const withEntries = classes.filter((c) => c.entries_count > 0);
  const totalEntries = classes.reduce((sum, c) => sum + c.entries_count, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Teaching Diary"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Record what you taught in each class`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withEntries.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with entries</p>
                <p className="text-2xl font-bold text-slate-900">{withEntries.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total entries</p>
                <p className="text-2xl font-bold text-slate-900">{totalEntries}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <TeachingDiaryClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
