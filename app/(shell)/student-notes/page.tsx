import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import StudentNotesClassCard from "@/components/student-notes/student-notes-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getStudentNotesOverviewForActiveYear } from "@/lib/queries/student-notes";

export const dynamic = "force-dynamic";

export default async function StudentNotesPage() {
  const { activeYear, classes } = await getStudentNotesOverviewForActiveYear();

  const withNotes = classes.filter((c) => c.notes_count > 0);
  const totalNotes = classes.reduce((sum, c) => sum + c.notes_count, 0);
  const openNotes = classes.reduce((sum, c) => sum + c.open_notes_count, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Student Notes"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Record observations and follow-ups for students`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withNotes.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with notes</p>
                <p className="text-2xl font-bold text-slate-900">{withNotes.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total notes</p>
                <p className="text-2xl font-bold text-slate-900">{totalNotes}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Open follow-ups</p>
                <p className="text-2xl font-bold text-slate-900">{openNotes}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <StudentNotesClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
