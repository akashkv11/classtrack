import ClassListCard from "@/components/classes/class-list-card";
import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getActiveClasses } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

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
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((cls) => {
            const todaySession = cls.attendanceSessions[0] ?? null;
            return (
              <ClassListCard
                key={cls.id}
                id={cls.id}
                displayName={cls.displayName}
                studentCount={cls._count.students}
                todayStatus={todaySession ? "marked" : "not_marked"}
              />
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
