import Card from "@/components/ui/card";
import { StatusBadgeFromConfig } from "@/components/ui/status-badge";
import { formatDisplayDate } from "@/lib/dates";
import {
  COMMUNICATION_REASON_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/lib/parent-communication/status";
import { NOTE_CATEGORY_LABELS } from "@/lib/student-notes/status";
import { parentCommunicationStatus } from "@/lib/ui/status-badges";
import type { NoteCategory } from "@/lib/types/student-note";
import type { ParentCommunicationSummary } from "@/lib/types/parent-communication";

type ParentCommunicationCardProps = {
  communication: ParentCommunicationSummary;
  onEdit: (communication: ParentCommunicationSummary) => void;
  onDelete: (communication: ParentCommunicationSummary) => void;
};

export default function ParentCommunicationCard({
  communication,
  onEdit,
  onDelete,
}: ParentCommunicationCardProps) {
  return (
    <Card padding="sm" className="mb-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {formatDisplayDate(
            new Date(communication.communication_date + "T00:00:00Z"),
          )}
          {" · "}
          {COMMUNICATION_TYPE_LABELS[communication.communication_type]}
          {" · "}
          {COMMUNICATION_REASON_LABELS[communication.reason]}
        </p>
        <StatusBadgeFromConfig status={parentCommunicationStatus(communication.status)} />
      </div>

      <p className="text-sm text-slate-800">{communication.summary}</p>

      {communication.linked_note && (
        <p className="mt-2 text-sm text-slate-600">
          Linked note:{" "}
          {NOTE_CATEGORY_LABELS[
            communication.linked_note.category as NoteCategory
          ] ?? communication.linked_note.category}
          {" — "}
          {communication.linked_note.note_text}
        </p>
      )}

      {communication.follow_up_needed && communication.follow_up_date && (
        <p className="mt-2 text-sm text-slate-600">
          Follow-up:{" "}
          {formatDisplayDate(
            new Date(communication.follow_up_date + "T00:00:00Z"),
          )}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onEdit(communication)}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(communication)}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
