"use client";

import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import SyllabusTopicStatusIcon from "@/components/syllabus/syllabus-topic-status-icon";
import type { SyllabusTopic } from "@/lib/types/syllabus";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/syllabus/progress";

const STATUS_BORDER: Record<string, string> = {
  NOT_STARTED: "border-l-slate-200",
  IN_PROGRESS: "border-l-blue-500",
  COMPLETED: "border-l-green-600",
  REVISED: "border-l-emerald-700",
  SKIPPED: "border-l-amber-500",
};

type SyllabusTopicListProps = {
  topics: SyllabusTopic[];
  onStatusChange: (topicId: string, status: string) => Promise<void>;
  onSelectTopic: (topic: SyllabusTopic) => void;
  onEditTopic: (topic: SyllabusTopic) => void;
  onDeleteTopic: (topic: SyllabusTopic) => void;
  updatingTopicId?: string | null;
};

export default function SyllabusTopicList({
  topics,
  onStatusChange,
  onSelectTopic,
  onEditTopic,
  onDeleteTopic,
  updatingTopicId,
}: SyllabusTopicListProps) {
  if (topics.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No topics yet. Add a topic to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <Card
          key={topic.id}
          className={`border-l-4 ${STATUS_BORDER[topic.status] ?? STATUS_BORDER.NOT_STARTED}`}
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelectTopic(topic)}
              className="flex items-start gap-2 text-left hover:text-blue-700"
            >
              <SyllabusTopicStatusIcon status={topic.status} className="mt-0.5" />
              <span className="text-base font-semibold text-slate-900">
                {topic.topic_title}
              </span>
            </button>
            <Badge variant={statusBadgeVariant(topic.status)}>
              {STATUS_LABELS[topic.status as keyof typeof STATUS_LABELS] ?? topic.status}
            </Badge>
          </div>

          <div className="mb-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-3">
            <p>Priority: {PRIORITY_LABELS[topic.priority] ?? topic.priority}</p>
            <p>Estimated classes: {topic.estimated_classes ?? "Unknown"}</p>
          </div>

          {topic.subtopics.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-slate-700">Subtopics:</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {topic.subtopics.slice(0, 5).map((st) => (
                  <li key={st.subtopic_title}>
                    - {st.subtopic_title}
                    {st.nested_subtopics.length > 0 && (
                      <ul className="ml-4 mt-1">
                        {st.nested_subtopics.slice(0, 4).map((nested) => (
                          <li key={nested}>- {nested}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {topic.status !== "IN_PROGRESS" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={updatingTopicId === topic.id}
                onClick={() => onStatusChange(topic.id, "IN_PROGRESS")}
              >
                Mark In Progress
              </Button>
            )}
            {topic.status !== "COMPLETED" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={updatingTopicId === topic.id}
                onClick={() => onStatusChange(topic.id, "COMPLETED")}
              >
                Mark Completed
              </Button>
            )}
            {topic.status !== "REVISED" && (
              <Button
                variant="secondary"
                size="sm"
                disabled={updatingTopicId === topic.id}
                onClick={() => onStatusChange(topic.id, "REVISED")}
              >
                Mark Revised
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => onSelectTopic(topic)}>
              Details
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onEditTopic(topic)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDeleteTopic(topic)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
