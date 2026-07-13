import NoAcademicYearAlert from "@/components/classes/no-academic-year-alert";
import AttendanceAlertsClassCard from "@/components/attendance-alerts/attendance-alerts-class-card";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { getAttendanceAlertsOverviewForActiveYear } from "@/lib/queries/attendance-alerts";

export const revalidate = 30;

export default async function AttendanceAlertsPage() {
  const { activeYear, classes } = await getAttendanceAlertsOverviewForActiveYear();

  const withAlerts = classes.filter((c) => c.total_alerts_count > 0);
  const totalAlerts = classes.reduce((sum, c) => sum + c.total_alerts_count, 0);
  const openAlerts = classes.reduce((sum, c) => sum + c.open_alerts_count, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Attendance Alerts"
        subtitle={
          activeYear
            ? `Academic Year: ${activeYear.name} · Students who need attendance follow-up`
            : undefined
        }
      />

      {!activeYear ? (
        <NoAcademicYearAlert />
      ) : classes.length === 0 ? (
        <p className="text-slate-600">No classes found for this academic year.</p>
      ) : (
        <>
          {withAlerts.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Classes with alerts</p>
                <p className="text-2xl font-bold text-slate-900">{withAlerts.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Total alerts (this month)</p>
                <p className="text-2xl font-bold text-slate-900">{totalAlerts}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-600">Open alerts</p>
                <p className="text-2xl font-bold text-slate-900">{openAlerts}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((overview) => (
              <AttendanceAlertsClassCard key={overview.class_id} overview={overview} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
