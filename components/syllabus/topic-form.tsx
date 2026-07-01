"use client";

import { useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import type { SyllabusChapterOption, SyllabusTopic } from "@/lib/types/syllabus";
import {
  FieldErrors,
  inputClassName,
  parseInput,
  syllabusTopicCreateSchema,
  syllabusTopicUpdateSchema,
} from "@/lib/validation";
import { parseMultilineSubtopics } from "@/lib/syllabus/normalize";

const PRIORITY_OPTIONS = ["LOW", "NORMAL", "IMPORTANT", "EXAM_IMPORTANT"] as const;

function subtopicsToText(subtopics: SyllabusTopic["subtopics"]) {
  return subtopics.map((st) => st.subtopic_title).join("\n");
}

type TopicFormProps = {
  open: boolean;
  classId: string;
  chapters: SyllabusChapterOption[];
  defaultChapterId?: string;
  topic?: SyllabusTopic | null;
  onClose: () => void;
  onSaved: () => void;
};

type TopicFormDialogProps = Omit<TopicFormProps, "open">;

function TopicFormDialog({
  classId,
  chapters,
  defaultChapterId,
  topic,
  onClose,
  onSaved,
}: TopicFormDialogProps) {
  const isEdit = Boolean(topic);
  const [chapterId, setChapterId] = useState(
    () => defaultChapterId ?? chapters[0]?.id ?? "",
  );
  const [topicTitle, setTopicTitle] = useState(() => topic?.topic_title ?? "");
  const [subtopicsText, setSubtopicsText] = useState(() =>
    topic ? subtopicsToText(topic.subtopics) : "",
  );
  const [priority, setPriority] = useState(() => topic?.priority ?? "NORMAL");
  const [estimatedClasses, setEstimatedClasses] = useState(() =>
    topic?.estimated_classes ? String(topic.estimated_classes) : "",
  );
  const [remarks, setRemarks] = useState(() => topic?.remarks ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isEdit && !chapterId) {
      setError("Select a chapter first");
      return;
    }

    const payload = {
      topic_title: topicTitle,
      subtopics: parseMultilineSubtopics(subtopicsText),
      priority,
      estimated_classes: estimatedClasses || null,
      remarks: remarks || undefined,
    };

    const parsed = isEdit
      ? parseInput(syllabusTopicUpdateSchema, {
          ...payload,
          remarks: remarks.trim() ? remarks : null,
        })
      : parseInput(syllabusTopicCreateSchema, payload);

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `/api/syllabus/topics/${topic!.id}?class_id=${classId}`
        : `/api/syllabus/chapters/${chapterId}/topics?class_id=${classId}`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save topic");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save topic");
    } finally {
      setLoading(false);
    }
  }

  function chapterLabel(ch: SyllabusChapterOption) {
    return ch.chapter_number
      ? `Chapter ${ch.chapter_number}: ${ch.chapter_title}`
      : ch.chapter_title;
  }

  return (
    <Modal
      open
      title={isEdit ? "Edit Topic" : "Add Topic"}
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="topic-form"
            variant="primary"
            disabled={loading || (!isEdit && !chapterId)}
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Save Topic"}
          </Button>
        </div>
      }
    >
      <form id="topic-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {!isEdit && (
          <FormField label="Chapter" error={fieldErrors.chapter_id}>
            <SelectInput
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              error={!!fieldErrors.chapter_id}
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {chapterLabel(ch)}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}
        <FormField label="Topic Title" error={fieldErrors.topic_title}>
          <TextInput
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            error={!!fieldErrors.topic_title}
          />
        </FormField>
        <FormField
          label="Subtopics"
          hint="One subtopic per line"
          error={fieldErrors.subtopics}
        >
          <textarea
            className={inputClassName(!!fieldErrors.subtopics)}
            rows={5}
            value={subtopicsText}
            onChange={(e) => setSubtopicsText(e.target.value)}
          />
        </FormField>
        <FormField label="Priority" error={fieldErrors.priority}>
          <SelectInput
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            error={!!fieldErrors.priority}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Estimated Classes" error={fieldErrors.estimated_classes}>
          <TextInput
            type="number"
            min={1}
            value={estimatedClasses}
            onChange={(e) => setEstimatedClasses(e.target.value)}
            placeholder="Unknown"
            error={!!fieldErrors.estimated_classes}
          />
        </FormField>
        <FormField label="Remarks" error={fieldErrors.remarks}>
          <TextInput
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            error={!!fieldErrors.remarks}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default function TopicForm({
  open,
  classId,
  chapters,
  defaultChapterId,
  topic,
  onClose,
  onSaved,
}: TopicFormProps) {
  if (!open) return null;

  const dialogKey = topic?.id ?? `new-${defaultChapterId ?? chapters[0]?.id ?? "chapter"}`;

  return (
    <TopicFormDialog
      key={dialogKey}
      classId={classId}
      chapters={chapters}
      defaultChapterId={defaultChapterId}
      topic={topic}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
