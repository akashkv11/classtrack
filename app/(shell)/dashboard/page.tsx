import DashboardClassCard from "@/components/dashboard/dashboard-class-card";
import DashboardFollowUps from "@/components/dashboard/dashboard-follow-ups";
import DashboardQuickActions from "@/components/dashboard/dashboard-quick-actions";
import DashboardTodayComplianceBanner from "@/components/dashboard/dashboard-today-compliance";
import DashboardTodaySchedule from "@/components/dashboard/dashboard-today-schedule";
import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { formatTodayHeading } from "@/lib/dates";
import { getDashboardData } from "@/lib/queries/dashboard";

export const revalidate = 30;

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Your control center — today's work, classes, and what needs attention."
      />

      {!data ? (
        <NoAcademicYearAlert />
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900">
              Today · {formatTodayHeading(data.today)}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Academic Year: {data.active_year_name}
            </p>

            <div className="mt-4">
              <DashboardFollowUps summary={data.follow_ups} />
              <DashboardTodayComplianceBanner compliance={data.today_compliance} />
              <DashboardTodaySchedule items={data.today_items} date={data.today} />
            </div>
          </section>

          <DashboardQuickActions />

          {data.classes.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Class Overview</h2>
              <p className="mt-1 text-sm text-slate-600">
                Attendance, diary, syllabus progress, and follow-ups for each class.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {data.classes.map((card) => (
                  <DashboardClassCard
                    key={card.class_id}
                    card={card}
                    lowMarksThresholdPercent={data.low_marks_threshold_percent}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}
