import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { Button, ButtonLink } from "@/components/ui/button";

type AttendanceToolbarProps = {
  classId: string;
  sessionId: string | null;
  saving: boolean;
  hasChanges: boolean;
  canSave: boolean;
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  onReset: () => void;
  onSave: () => void;
};

export default function AttendanceToolbar({
  classId,
  sessionId,
  saving,
  hasChanges,
  canSave,
  onMarkAllPresent,
  onMarkAllAbsent,
  onReset,
  onSave,
}: AttendanceToolbarProps) {
  return (
    <ActionBar className="mb-4">
      <Button
        variant="secondary"
        size="sm"
        className={actionButtonClassName}
        onClick={onMarkAllPresent}
      >
        Mark All Present
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={actionButtonClassName}
        onClick={onMarkAllAbsent}
      >
        Mark All Absent
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={actionButtonClassName}
        onClick={onReset}
        disabled={!hasChanges}
      >
        Reset Changes
      </Button>
      <Button
        size="sm"
        className={actionButtonClassName}
        onClick={onSave}
        disabled={saving || !canSave}
      >
        {saving ? "Saving..." : "Save Attendance"}
      </Button>
      {sessionId && (
        <ButtonLink
          href={`/classes/${classId}/summary/${sessionId}`}
          variant="secondary"
          size="sm"
          className={actionButtonClassName}
        >
          View Summary
        </ButtonLink>
      )}
    </ActionBar>
  );
}
