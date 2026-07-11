import { formatMonthLabel } from "@/lib/attendance-alerts/status";
import type { AttendanceAlertsListResponse } from "@/lib/types/attendance-alert";

type AttendanceAlertsSummaryProps = {
  summary: AttendanceAlertsListResponse["summary"];
  month: string;
};

export default function AttendanceAlertsSummary({
  summary,
  month,
}: AttendanceAlertsSummaryProps) {
  return (
    <div className="mb-6">
      <p className="mb-3 text-sm text-slate-600">{formatMonthLabel(month)}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Open alerts</p>
          <p className="text-2xl font-bold text-slate-900">{summary.open}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Low attendance</p>
          <p className="text-2xl font-bold text-slate-900">{summary.low_attendance}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Continuous absence</p>
          <p className="text-2xl font-bold text-slate-900">{summary.continuous_absence}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Frequent absence</p>
          <p className="text-2xl font-bold text-slate-900">{summary.frequent_absence}</p>
        </div>
      </div>
    </div>
  );
}
