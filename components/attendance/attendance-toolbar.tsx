import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import { Button, ButtonLink } from "@/components/ui/button";

type AttendanceToolbarProps = {
  classId: string;
  sessionId: string | null;
  saving: boolean;
  deleting?: boolean;
  hasChanges: boolean;
  canSave: boolean;
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  onReset: () => void;
  onSave: () => void;
  onDelete?: () => void;
};

export default function AttendanceToolbar({
  classId,
  sessionId,
  saving,
  deleting = false,
  hasChanges,
  canSave,
  onMarkAllPresent,
  onMarkAllAbsent,
  onReset,
  onSave,
  onDelete,
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
        disabled={saving || deleting || !canSave}
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
      {sessionId && onDelete && (
        <Button
          variant="danger"
          size="sm"
          className={actionButtonClassName}
          onClick={onDelete}
          disabled={saving || deleting}
        >
          {deleting ? "Deleting..." : "Delete Attendance"}
        </Button>
      )}
    </ActionBar>
  );
}
