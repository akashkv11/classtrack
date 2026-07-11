import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import AssessmentsClassCard from "@/components/assessments/assessments-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getAssessmentsOverviewForActiveYear } from "@/lib/queries/assessments";

export const dynamic = "force-dynamic";

export default async function MarksPage() {
  const { activeYear, classes } = await getAssessmentsOverviewForActiveYear();

  const withAssessments = classes.filter((c) => c.assessments_count > 0);
  const totalAssessments = classes.reduce((sum, c) => sum + c.assessments_count, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Marks / Assessments"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Record test scores and assessment results`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withAssessments.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with assessments</p>
                <p className="text-2xl font-bold text-slate-900">{withAssessments.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total assessments</p>
                <p className="text-2xl font-bold text-slate-900">{totalAssessments}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <AssessmentsClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
