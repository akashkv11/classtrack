import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import StudentProfileDirectory from "@/components/student-profile/student-profile-directory";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getStudentsDirectoryForActiveYear } from "@/lib/queries/student-profile";

export const revalidate = 30;

export default async function StudentProfilePage() {
  const { activeYear, classes, students } = await getStudentsDirectoryForActiveYear();

  return (
    <PageContainer>
      <PageHeader
        title="Student Profile"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Browse all students across your classes`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : students.length === 0 ? (
        <p className="text-slate-600">
          No students yet. Add students from a class page to view profiles here.
        </p>
      ) : (
        <StudentProfileDirectory classes={classes} students={students} />
      )}
    </PageContainer>
  );
}
