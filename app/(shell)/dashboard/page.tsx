import ClassListCard from "@/components/classes/class-list-card";
import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import TodaySchedule from "@/components/today/today-schedule";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { formatTodayHeading, todayISO } from "@/lib/dates";
import { getActiveClasses } from "@/lib/queries/classes";
import { getTodaySchedule } from "@/lib/queries/timetable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { activeYear, classes } = await getActiveClasses();
  const today = todayISO();
  const schedule = activeYear ? await getTodaySchedule(today) : [];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Your control center — today's work, classes, and what needs attention."
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900">
              Today · {formatTodayHeading(today)}
            </h2>
            <div className="mt-4">
              <TodaySchedule items={schedule} />
            </div>
          </section>

          {classes.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Your Classes</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}
