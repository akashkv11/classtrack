import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import TodaySchedule from "@/components/today/today-schedule";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { todayISO } from "@/lib/dates";
import { getActiveAcademicYear } from "@/lib/queries/classes";
import { getTodaySchedule } from "@/lib/queries/timetable";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const activeYear = await getActiveAcademicYear();
  const today = todayISO();
  const schedule = activeYear ? await getTodaySchedule(today) : [];

  return (
    <PageContainer>
      <PageHeader
        title="Today"
        subtitle="Your daily overview — classes, tasks, and what needs attention."
      />

      {activeYear ? (
        <TodaySchedule items={schedule} />
      ) : (
        <NoAcademicYearAlert />
      )}
    </PageContainer>
  );
}
