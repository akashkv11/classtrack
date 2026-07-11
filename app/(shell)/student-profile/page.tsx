import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import StudentProfileClassCard from "@/components/student-profile/student-profile-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getStudentProfileOverviewForActiveYear } from "@/lib/queries/student-profile";

export const dynamic = "force-dynamic";

export default async function StudentProfileHubPage() {
  const { activeYear, classes } = await getStudentProfileOverviewForActiveYear();

  const withStudents = classes.filter((c) => c.student_count > 0);
  const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Student Profile"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · View student attendance, marks, and overview`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withStudents.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with students</p>
                <p className="text-2xl font-bold text-slate-900">{withStudents.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total students</p>
                <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <StudentProfileClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
