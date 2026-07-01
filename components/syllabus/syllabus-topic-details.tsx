"use client";

import Modal from "@/components/ui/modal";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SyllabusTopic } from "@/lib/types/syllabus";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/syllabus/progress";

type SyllabusTopicDetailsProps = {
  open: boolean;
  topic: SyllabusTopic | null;
  chapterTitle: string;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: string) => Promise<void>;
  updating?: boolean;
};

export default function SyllabusTopicDetails({
  open,
  topic,
  chapterTitle,
  onClose,
  onEdit,
  onStatusChange,
  updating,
}: SyllabusTopicDetailsProps) {
  if (!topic) return null;

  return (
    <Modal open={open} title="Topic Details" onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Topic</p>
          <p className="font-medium text-slate-900">{topic.topic_title}</p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Chapter</p>
          <p className="text-slate-800">{chapterTitle}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <Badge variant={statusBadgeVariant(topic.status)}>
              {STATUS_LABELS[topic.status as keyof typeof STATUS_LABELS] ?? topic.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-slate-500">Priority</p>
            <p className="text-slate-800">
              {PRIORITY_LABELS[topic.priority] ?? topic.priority}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Estimated Classes</p>
            <p className="text-slate-800">{topic.estimated_classes ?? "Unknown"}</p>
          </div>
        </div>

        {topic.subtopics.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Subtopics</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {topic.subtopics.map((st) => (
                <li key={st.subtopic_title}>
                  <p>- {st.subtopic_title}</p>
                  {st.nested_subtopics.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-0.5 text-slate-600">
                      {st.nested_subtopics.map((nested) => (
                        <li key={nested}>- {nested}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm text-slate-500">Remarks</p>
          <p className="text-slate-800">{topic.remarks?.trim() || "Empty"}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit Topic
          </Button>
          {topic.status !== "IN_PROGRESS" && (
            <Button
              variant="secondary"
              size="sm"
              disabled={updating}
              onClick={() => onStatusChange("IN_PROGRESS")}
            >
              Mark In Progress
            </Button>
          )}
          {topic.status !== "COMPLETED" && (
            <Button
              variant="secondary"
              size="sm"
              disabled={updating}
              onClick={() => onStatusChange("COMPLETED")}
            >
              Mark Completed
            </Button>
          )}
          {topic.status !== "REVISED" && (
            <Button
              variant="secondary"
              size="sm"
              disabled={updating}
              onClick={() => onStatusChange("REVISED")}
            >
              Mark Revised
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
