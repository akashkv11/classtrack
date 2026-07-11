import Card from "@/components/ui/card";
import type { DashboardTodayCompliance } from "@/lib/types/dashboard";

type DashboardTodayComplianceBannerProps = {
  compliance: DashboardTodayCompliance;
};

export default function DashboardTodayComplianceBanner({
  compliance,
}: DashboardTodayComplianceBannerProps) {
  if (compliance.scheduled_classes === 0) return null;

  const hasWarnings =
    compliance.attendance_pending > 0 || compliance.diary_pending > 0;
  if (!hasWarnings) return null;

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50/60">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
        Today&apos;s Scheduled Classes
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-amber-950">
        {compliance.attendance_pending > 0 && (
          <li>
            {compliance.attendance_pending} scheduled class
            {compliance.attendance_pending === 1 ? "" : "es"} still need attendance
            marked
          </li>
        )}
        {compliance.diary_pending > 0 && (
          <li>
            {compliance.diary_pending} scheduled class
            {compliance.diary_pending === 1 ? "" : "es"} still need a teaching diary
            entry
          </li>
        )}
      </ul>
    </Card>
  );
}
