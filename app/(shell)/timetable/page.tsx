import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import TimetableContent from "@/components/timetable/timetable-content";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getActiveClasses } from "@/lib/queries/classes";
import { getTodayScheduleItems } from "@/lib/queries/dashboard";
import { getTimetableEntries } from "@/lib/queries/timetable";
import { todayISO } from "@/lib/dates";

export const revalidate = 30;

export default async function TimetablePage() {
  const { activeYear, classes } = await getActiveClasses();

  if (!activeYear) {
    return (
      <PageContainer>
        <PageHeader
          title="Timetable"
          subtitle="Your full teaching schedule — classes, subjects, and periods."
        />
        <NoAcademicYearAlert />
      </PageContainer>
    );
  }

  const [entries, classOptions, todayItems] = await Promise.all([
    getTimetableEntries(),
    Promise.resolve(
      classes.map((cls) => ({
        id: cls.id,
        displayName: cls.displayName,
        stream: cls.stream,
      })),
    ),
    getTodayScheduleItems(todayISO()),
  ]);

  return (
    <PageContainer>
      <TimetableContent
        classes={classOptions}
        initialEntries={entries}
        todayItems={todayItems}
        today={todayISO()}
      />
    </PageContainer>
  );
}
