import Card from "@/components/ui/card";
import MarkPreparationButton from "@/components/preparation/mark-preparation-button";
import { getPreparationAlerts } from "@/lib/queries/preparation";

export default async function PreparationFollowUps({ classIds, date }: { classIds: string[]; date: string }) {
  const alerts = await getPreparationAlerts(classIds, date);
  if (alerts.length === 0) return null;
  return (
    <Card className="mb-6 border-red-200 bg-red-50/40">
      <h3 className="font-semibold text-red-900">Preparation Follow-ups</h3>
      <p className="mt-1 text-sm text-slate-600">Students reaching the consecutive recorded-class threshold. A prepared or unmarked entry breaks the streak.</p>
      <ul className="mt-3 space-y-3">
        {alerts.map((alert) => (
          <li key={`${alert.classId}:${alert.studentId}`} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium text-slate-900">{alert.fullName} · {alert.className}</p>
              <p className="text-red-800">{alert.streak} consecutive recorded classes · latest {alert.date}</p>
            </div>
            <MarkPreparationButton classId={alert.classId} date={alert.date} timetableEntryId={alert.timetableEntryId} title={alert.subject ?? alert.className} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
