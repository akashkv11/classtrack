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
    <div className="mb-4 flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={onMarkAllPresent}>
        Mark All Present
      </Button>
      <Button variant="secondary" size="sm" onClick={onMarkAllAbsent}>
        Mark All Absent
      </Button>
      <Button variant="secondary" size="sm" onClick={onReset} disabled={!hasChanges}>
        Reset Changes
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving || !canSave}>
        {saving ? "Saving..." : "Save Attendance"}
      </Button>
      {sessionId && (
        <ButtonLink href={`/classes/${classId}/summary/${sessionId}`} variant="secondary" size="sm">
          View Summary
        </ButtonLink>
      )}
    </div>
  );
}
