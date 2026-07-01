"use client";

import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import type { SyllabusChapterSummary } from "@/lib/types/syllabus";
import { STATUS_LABELS, statusBadgeVariant } from "@/lib/syllabus/progress";

type SyllabusChapterCardProps = {
  classId: string;
  chapter: SyllabusChapterSummary;
  onEdit: (chapter: SyllabusChapterSummary) => void;
  onDelete: (chapter: SyllabusChapterSummary) => void;
};

function chapterStatus(chapter: SyllabusChapterSummary): string {
  const s = chapter.status_summary;
  if (s.completed + s.revised === chapter.topics_count && chapter.topics_count > 0) {
    return s.revised > 0 ? "REVISED" : "COMPLETED";
  }
  if (s.in_progress > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export default function SyllabusChapterCard({
  classId,
  chapter,
  onEdit,
  onDelete,
}: SyllabusChapterCardProps) {
  const status = chapterStatus(chapter);
  const label = chapter.chapter_number
    ? `Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`
    : chapter.chapter_title;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{label}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {chapter.topics_count} topics · {chapter.subtopics_count} subtopics
          </p>
        </div>
        <Badge variant={statusBadgeVariant(status)}>
          {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
        </Badge>
      </div>

      <p className="mb-3 text-sm text-slate-600">
        Progress: {chapter.progress_percentage}%
      </p>

      {chapter.topics.length > 0 && (
        <ul className="mb-4 space-y-1 text-sm text-slate-700">
          {chapter.topics.slice(0, 6).map((topic) => (
            <li key={topic.id} className="flex items-center gap-2">
              <span className="text-slate-400">
                {topic.status === "COMPLETED" || topic.status === "REVISED" ? "☑" : "□"}
              </span>
              {topic.topic_title}
            </li>
          ))}
          {chapter.topics.length > 6 && (
            <li className="text-slate-500">+ {chapter.topics.length - 6} more topics</li>
          )}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <ButtonLink
          href={`/classes/${classId}/syllabus/chapters/${chapter.id}`}
          variant="secondary"
          size="sm"
        >
          Open
        </ButtonLink>
        <Button variant="secondary" size="sm" onClick={() => onEdit(chapter)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(chapter)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
