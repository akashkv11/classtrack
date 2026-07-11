import Card from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadgeFromConfig } from "@/components/ui/status-badge";
import { buildAlertDetailsLine } from "@/lib/attendance-alerts/detect";
import { ALERT_TYPE_LABELS } from "@/lib/attendance-alerts/status";
import { alertStatus } from "@/lib/ui/status-badges";
import type { AlertStatus, AlertType, AttendanceAlertSummary } from "@/lib/types/attendance-alert";

type AttendanceAlertCardProps = {
  classId: string;
  alert: AttendanceAlertSummary;
  updating: boolean;
  onStatusChange: (
    alertKey: string,
    studentId: string,
    alertType: AlertType,
    status: AlertStatus,
  ) => void;
};

export default function AttendanceAlertCard({
  classId,
  alert,
  updating,
  onStatusChange,
}: AttendanceAlertCardProps) {
  const detailsLine = buildAlertDetailsLine(alert);
  const profileBase = `/classes/${classId}/students/${alert.student_id}`;

  return (
    <Card padding="sm" className="mb-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{alert.full_name}</h3>
          <p className="text-sm text-slate-600">Roll {alert.roll_no}</p>
        </div>
        <StatusBadgeFromConfig status={alertStatus(alert.status)} />
      </div>

      <p className="text-sm font-medium text-slate-800">
        {ALERT_TYPE_LABELS[alert.alert_type]}: {alert.title}
      </p>
      <p className="mt-1 text-sm text-slate-700">{alert.message}</p>
      {detailsLine && <p className="mt-2 text-sm text-slate-600">{detailsLine}</p>}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <ButtonLink size="sm" variant="secondary" href={`${profileBase}#student-notes`}>
          Add Student Note
        </ButtonLink>
        <ButtonLink
          size="sm"
          variant="secondary"
          href={`${profileBase}#parent-communication`}
        >
          Record Parent Communication
        </ButtonLink>
        {alert.status !== "IN_PROGRESS" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={updating}
            onClick={() =>
              onStatusChange(alert.alert_key, alert.student_id, alert.alert_type, "IN_PROGRESS")
            }
          >
            Mark In Progress
          </Button>
        )}
        {alert.status !== "RESOLVED" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={updating}
            onClick={() =>
              onStatusChange(alert.alert_key, alert.student_id, alert.alert_type, "RESOLVED")
            }
          >
            Mark Resolved
          </Button>
        )}
        {alert.status !== "IGNORED" && (
          <Button
            size="sm"
            variant="secondary"
            disabled={updating}
            onClick={() =>
              onStatusChange(alert.alert_key, alert.student_id, alert.alert_type, "IGNORED")
            }
          >
            Ignore
          </Button>
        )}
      </div>
    </Card>
  );
}
