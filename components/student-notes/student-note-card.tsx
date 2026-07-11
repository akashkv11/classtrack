import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import {
  NOTE_CATEGORY_LABELS,
  NOTE_STATUS_LABELS,
  noteStatusBadgeVariant,
} from "@/lib/student-notes/status";
import type { StudentNoteSummary } from "@/lib/types/student-note";

type StudentNoteCardProps = {
  note: StudentNoteSummary;
  onEdit: (note: StudentNoteSummary) => void;
  onDelete: (note: StudentNoteSummary) => void;
  onToggleStatus: (note: StudentNoteSummary) => void;
};

export default function StudentNoteCard({
  note,
  onEdit,
  onDelete,
  onToggleStatus,
}: StudentNoteCardProps) {
  const statusVariant = noteStatusBadgeVariant(note.status);

  return (
    <Card padding="sm" className="mb-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {formatDisplayDate(new Date(note.note_date + "T00:00:00Z"))}
          {" · "}
          {NOTE_CATEGORY_LABELS[note.category]}
        </p>
        <Badge variant={statusVariant}>{NOTE_STATUS_LABELS[note.status]}</Badge>
      </div>

      <p className="text-sm text-slate-800">{note.note_text}</p>

      {note.follow_up_needed && note.follow_up_date && (
        <p className="mt-2 text-sm text-slate-600">
          Follow-up:{" "}
          {formatDisplayDate(new Date(note.follow_up_date + "T00:00:00Z"))}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onEdit(note)}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onToggleStatus(note)}
          className="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Mark {note.status === "OPEN" ? "Closed" : "Open"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(note)}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
