import ClassesPageClient from "@/components/classes/classes-page-client";
import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getActiveClasses } from "@/lib/queries/classes";

export const revalidate = 30;

export default async function ClassesPage() {
  const { activeYear, classes } = await getActiveClasses();

  return (
    <PageContainer>
      <PageHeader
        title="Classes"
        subtitle={
          activeYear ? `Academic Year: ${activeYear.name}` : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : (
        <ClassesPageClient
          hasActiveYear
          initialClasses={classes.map((cls) => ({
            id: cls.id,
            displayName: cls.displayName,
            studentCount: cls._count.students,
            todayStatus: cls.attendanceSessions.length > 0 ? "marked" : "not_marked",
          }))}
        />
      )}
    </PageContainer>
  );
}
