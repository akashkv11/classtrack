import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/dates";
import {
  DIARY_STATUS_LABELS,
  STUDENT_RESPONSE_LABELS,
  diaryStatusBadgeVariant,
} from "@/lib/teaching-diary/status";
import type { TeachingDiaryEntrySummary } from "@/lib/types/teaching-diary";

type TeachingDiaryCardProps = {
  entry: TeachingDiaryEntrySummary;
  onEdit: (entry: TeachingDiaryEntrySummary) => void;
  onDelete: (entry: TeachingDiaryEntrySummary) => void;
};

function chapterLabel(chapter: TeachingDiaryEntrySummary["chapter"]) {
  if (!chapter) return null;
  return chapter.chapter_number
    ? `Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`
    : chapter.chapter_title;
}

function topicTaughtLabel(status: TeachingDiaryEntrySummary["diary_status"]) {
  switch (status) {
    case "EXAM":
      return "Exam: ";
    case "REVISION":
      return "Revision: ";
    case "CANCELLED":
      return "Session: ";
    default:
      return "Taught: ";
  }
}

export default function TeachingDiaryCard({
  entry,
  onEdit,
  onDelete,
}: TeachingDiaryCardProps) {
  const badgeVariant = diaryStatusBadgeVariant(entry.diary_status);
  const badgeMap = {
    success: "success",
    warning: "warning",
    info: "info",
    danger: "warning",
    default: "neutral",
  } as const;

  return (
    <Card className="mb-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {formatDisplayDate(new Date(entry.entry_date + "T00:00:00Z"))}
            {entry.subject ? ` · ${entry.subject.name}` : ""}
          </p>
          {entry.chapter && (
            <p className="mt-1 font-semibold text-slate-900">{chapterLabel(entry.chapter)}</p>
          )}
          {entry.topic && (
            <p className="text-sm text-slate-700">Topic: {entry.topic.topic_title}</p>
          )}
        </div>
        <Badge variant={badgeMap[badgeVariant]}>
          {DIARY_STATUS_LABELS[entry.diary_status]}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-slate-700">
        <div>
          <span className="font-medium text-slate-800">
            {topicTaughtLabel(entry.diary_status)}
          </span>
          {entry.topic_taught}
        </div>
        {entry.teaching_notes && (
          <div>
            <span className="font-medium text-slate-800">Notes: </span>
            {entry.teaching_notes}
          </div>
        )}
        {entry.examples_covered && (
          <div>
            <span className="font-medium text-slate-800">Examples: </span>
            {entry.examples_covered}
          </div>
        )}
        {entry.student_response && entry.student_response !== "NOT_RECORDED" && (
          <div>
            <span className="font-medium text-slate-800">Student Response: </span>
            {STUDENT_RESPONSE_LABELS[entry.student_response]}
          </div>
        )}
        {entry.next_class_plan && (
          <div>
            <span className="font-medium text-slate-800">Next Class: </span>
            {entry.next_class_plan}
          </div>
        )}
        {entry.remarks && (
          <div>
            <span className="font-medium text-slate-800">Remarks: </span>
            {entry.remarks}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(entry)}>
          Edit
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onDelete(entry)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
