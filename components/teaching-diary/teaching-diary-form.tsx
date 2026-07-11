"use client";

import { useEffect, useRef, useState } from "react";
import Modal, { modalFooterClassName } from "@/components/ui/modal";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import { inputClassName } from "@/lib/validation";
import {
  FieldErrors,
  parseInput,
  teachingDiaryCreateSchema,
  teachingDiaryUpdateSchema,
} from "@/lib/validation";
import { todayISO } from "@/lib/dates";
import {
  DIARY_STATUS_LABELS,
  STUDENT_RESPONSE_LABELS,
  SYLLABUS_STATUS_UPDATE_LABELS,
  suggestSyllabusStatusUpdate,
} from "@/lib/teaching-diary/status";
import { buildTopicTaughtSuggestion } from "@/lib/teaching-diary/suggestions";
import { STATUS_LABELS } from "@/lib/syllabus/progress";
import type { TopicStatus } from "@/lib/syllabus/progress";
import type {
  DiaryStatus,
  StudentResponse,
  SyllabusStatusUpdate,
  TeachingDiaryEntrySummary,
} from "@/lib/types/teaching-diary";
import type { SyllabusSubjectDetail, SyllabusSubjectSummary } from "@/lib/types/syllabus";

const DIARY_STATUSES = Object.keys(DIARY_STATUS_LABELS) as DiaryStatus[];
const STUDENT_RESPONSES = Object.keys(STUDENT_RESPONSE_LABELS) as StudentResponse[];
const SYLLABUS_STATUS_UPDATES = Object.keys(
  SYLLABUS_STATUS_UPDATE_LABELS,
) as SyllabusStatusUpdate[];

type TeachingDiaryFormProps = {
  open: boolean;
  classId: string;
  subjects: SyllabusSubjectSummary[];
  entry?: TeachingDiaryEntrySummary | null;
  timetablePrefill?: {
    timetable_entry_id?: string;
    entry_date: string;
    syllabus_subject_id?: string | null;
    subject_name?: string;
    start_time?: string;
    end_time?: string;
  } | null;
  onClose: () => void;
  onSaved: () => void;
};

type TeachingDiaryFormDialogProps = Omit<TeachingDiaryFormProps, "open">;

function chapterLabel(ch: { chapter_number: number | null; chapter_title: string }) {
  return ch.chapter_number
    ? `Chapter ${ch.chapter_number}: ${ch.chapter_title}`
    : ch.chapter_title;
}

function TeachingDiaryFormDialog({
  classId,
  subjects,
  entry,
  timetablePrefill,
  onClose,
  onSaved,
}: TeachingDiaryFormDialogProps) {
  const isEdit = Boolean(entry);

  const [entryDate, setEntryDate] = useState(
    () => entry?.entry_date ?? timetablePrefill?.entry_date ?? todayISO(),
  );
  const [subjectId, setSubjectId] = useState(
    () => entry?.subject?.id ?? timetablePrefill?.syllabus_subject_id ?? "",
  );
  const [chapterId, setChapterId] = useState(() => entry?.chapter?.id ?? "");
  const [topicId, setTopicId] = useState(() => entry?.topic?.id ?? "");
  const [subjectDetail, setSubjectDetail] = useState<SyllabusSubjectDetail | null>(null);
  const [topicTaught, setTopicTaught] = useState(() => entry?.topic_taught ?? "");
  const [teachingNotes, setTeachingNotes] = useState(() => entry?.teaching_notes ?? "");
  const [examplesCovered, setExamplesCovered] = useState(() => entry?.examples_covered ?? "");
  const [studentResponse, setStudentResponse] = useState<StudentResponse>(
    () => entry?.student_response ?? "NOT_RECORDED",
  );
  const [nextClassPlan, setNextClassPlan] = useState(() => entry?.next_class_plan ?? "");
  const [diaryStatus, setDiaryStatus] = useState<DiaryStatus>(
    () => entry?.diary_status ?? "TAUGHT",
  );
  const [syllabusStatusUpdate, setSyllabusStatusUpdate] = useState<SyllabusStatusUpdate>(
    () => entry?.syllabus_status_update ?? "KEEP_CURRENT",
  );
  const [remarks, setRemarks] = useState(() => entry?.remarks ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const lastSuggestionRef = useRef(entry?.topic_taught ?? "");
  const topicTaughtRef = useRef(entry?.topic_taught ?? "");
  const lastSyllabusSuggestionRef = useRef<SyllabusStatusUpdate>("KEEP_CURRENT");
  const syllabusUpdateTouchedRef = useRef(
    Boolean(
      isEdit &&
        entry?.syllabus_status_update &&
        entry.syllabus_status_update !== "KEEP_CURRENT",
    ),
  );
  const [topicTaughtAutoFilled, setTopicTaughtAutoFilled] = useState(false);
  const [syllabusStatusSuggested, setSyllabusStatusSuggested] = useState(false);

  topicTaughtRef.current = topicTaught;

  useEffect(() => {
    if (!subjectId) {
      setSubjectDetail(null);
      return;
    }

    let cancelled = false;

    async function loadSubject() {
      const res = await fetch(`/api/classes/${classId}/syllabus/${subjectId}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setSubjectDetail(data);
    }

    loadSubject();
    return () => {
      cancelled = true;
    };
  }, [classId, subjectId]);

  const chapters = subjectDetail?.chapters ?? [];
  const selectedChapter = chapters.find((ch) => ch.id === chapterId);
  const topics = selectedChapter?.topics ?? [];
  const selectedTopic = topics.find((t) => t.id === topicId);
  const currentTopicStatus = selectedTopic?.status as TopicStatus | undefined;

  function applySyllabusStatusSuggestion(status: DiaryStatus, force = false) {
    const suggestion = suggestSyllabusStatusUpdate(status);
    const previousSuggestion = lastSyllabusSuggestionRef.current;
    const shouldApply =
      force ||
      !syllabusUpdateTouchedRef.current ||
      syllabusStatusUpdate === "KEEP_CURRENT" ||
      syllabusStatusUpdate === previousSuggestion;

    lastSyllabusSuggestionRef.current = suggestion;

    if (shouldApply) {
      setSyllabusStatusUpdate(suggestion);
      setSyllabusStatusSuggested(suggestion !== "KEEP_CURRENT");
    }
  }

  function clearSyllabusStatusSuggestion() {
    if (
      !syllabusUpdateTouchedRef.current ||
      syllabusStatusUpdate === lastSyllabusSuggestionRef.current
    ) {
      setSyllabusStatusUpdate("KEEP_CURRENT");
      setSyllabusStatusSuggested(false);
      syllabusUpdateTouchedRef.current = false;
    }
    lastSyllabusSuggestionRef.current = "KEEP_CURRENT";
  }

  function applyTopicTaughtSuggestion(suggestion: string, force = false) {
    const current = topicTaughtRef.current;
    const shouldApply = force || !current.trim() || current === lastSuggestionRef.current;
    lastSuggestionRef.current = suggestion;
    if (shouldApply) {
      setTopicTaught(suggestion);
      setTopicTaughtAutoFilled(true);
    } else {
      setTopicTaughtAutoFilled(false);
    }
  }

  function clearTopicTaughtSuggestion() {
    if (topicTaughtRef.current === lastSuggestionRef.current) {
      setTopicTaught("");
      setTopicTaughtAutoFilled(false);
    }
    lastSuggestionRef.current = "";
  }

  function handleTopicChange(value: string) {
    setTopicId(value);

    if (!value) {
      clearTopicTaughtSuggestion();
      clearSyllabusStatusSuggestion();
      return;
    }

    const topic = topics.find((t) => t.id === value);
    if (topic) {
      applyTopicTaughtSuggestion(buildTopicTaughtSuggestion(topic));
      applySyllabusStatusSuggestion(diaryStatus);
    }
  }

  function handleSubjectChange(value: string) {
    setSubjectId(value);
    setChapterId("");
    setTopicId("");
    clearTopicTaughtSuggestion();
    clearSyllabusStatusSuggestion();
  }

  function handleChapterChange(value: string) {
    setChapterId(value);
    setTopicId("");
    clearTopicTaughtSuggestion();
    clearSyllabusStatusSuggestion();
  }

  function handleDiaryStatusChange(value: DiaryStatus) {
    setDiaryStatus(value);
    if (topicId) {
      applySyllabusStatusSuggestion(value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const payload = {
      entry_date: entryDate,
      timetable_entry_id: !isEdit ? timetablePrefill?.timetable_entry_id ?? null : null,
      syllabus_subject_id: subjectId || null,
      syllabus_chapter_id: chapterId || null,
      syllabus_topic_id: topicId || null,
      topic_taught: topicTaught,
      teaching_notes: teachingNotes.trim() || null,
      examples_covered: examplesCovered.trim() || null,
      student_response: studentResponse,
      next_class_plan: nextClassPlan.trim() || null,
      diary_status: diaryStatus,
      syllabus_status_update: syllabusStatusUpdate,
      remarks: remarks.trim() || null,
    };

    const parsed = isEdit
      ? parseInput(teachingDiaryUpdateSchema, payload)
      : parseInput(teachingDiaryCreateSchema, payload);

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? `/api/teaching-diary/${entry!.id}?class_id=${classId}`
        : `/api/classes/${classId}/teaching-diary`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save diary entry");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save diary entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      title={isEdit ? "Edit Teaching Diary Entry" : "Add Teaching Diary Entry"}
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className={modalFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="teaching-diary-form" variant="primary" disabled={loading}>
            {loading ? "Saving…" : "Save Entry"}
          </Button>
        </div>
      }
    >
      <form id="teaching-diary-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <FormField label="Date" error={fieldErrors.entry_date}>
          <TextInput
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            error={!!fieldErrors.entry_date}
          />
        </FormField>

        {subjects.length > 0 && (
          <FormField label="Subject" error={fieldErrors.syllabus_subject_id}>
            <SelectInput
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              error={!!fieldErrors.syllabus_subject_id}
            >
              <option value="">No subject linked</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject_name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}

        {subjectId && chapters.length > 0 && (
          <FormField label="Chapter" error={fieldErrors.syllabus_chapter_id}>
            <SelectInput
              value={chapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
              error={!!fieldErrors.syllabus_chapter_id}
            >
              <option value="">No chapter linked</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {chapterLabel(ch)}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}

        {chapterId && topics.length > 0 && (
          <FormField label="Syllabus Topic" error={fieldErrors.syllabus_topic_id}>
            <SelectInput
              value={topicId}
              onChange={(e) => handleTopicChange(e.target.value)}
              error={!!fieldErrors.syllabus_topic_id}
            >
              <option value="">No topic linked</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.topic_title}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}

        {selectedTopic && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-700">
              Current Syllabus Status:{" "}
              {STATUS_LABELS[currentTopicStatus ?? "NOT_STARTED"]}
            </p>
            {selectedTopic.subtopics.length > 0 && (
              <div className="mt-2">
                <p className="text-slate-600">Subtopics:</p>
                <ul className="mt-1 list-inside list-disc text-slate-600">
                  {selectedTopic.subtopics.map((st) => (
                    <li key={st.subtopic_title}>{st.subtopic_title}</li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    applyTopicTaughtSuggestion(
                      buildTopicTaughtSuggestion(selectedTopic),
                      true,
                    )
                  }
                >
                  Use subtopics as topic taught
                </Button>
              </div>
            )}
          </div>
        )}

        <FormField
          label="Topic Taught"
          hint={
            topicTaughtAutoFilled
              ? "Auto-filled from syllabus topic. Edit as needed."
              : undefined
          }
          error={fieldErrors.topic_taught}
        >
          <textarea
            className={inputClassName(!!fieldErrors.topic_taught)}
            rows={3}
            value={topicTaught}
            onChange={(e) => {
              setTopicTaught(e.target.value);
              setTopicTaughtAutoFilled(e.target.value === lastSuggestionRef.current);
            }}
            placeholder={
              selectedTopic
                ? "Edit the suggestion or keep as-is"
                : "What did you teach today?"
            }
          />
        </FormField>

        <FormField label="Teaching Notes" error={fieldErrors.teaching_notes}>
          <textarea
            className={inputClassName(!!fieldErrors.teaching_notes)}
            rows={2}
            value={teachingNotes}
            onChange={(e) => setTeachingNotes(e.target.value)}
          />
        </FormField>

        <FormField label="Examples / Classwork Covered" error={fieldErrors.examples_covered}>
          <textarea
            className={inputClassName(!!fieldErrors.examples_covered)}
            rows={2}
            value={examplesCovered}
            onChange={(e) => setExamplesCovered(e.target.value)}
          />
        </FormField>

        <FormField label="Student Response" error={fieldErrors.student_response}>
          <SelectInput
            value={studentResponse}
            onChange={(e) => setStudentResponse(e.target.value as StudentResponse)}
            error={!!fieldErrors.student_response}
          >
            {STUDENT_RESPONSES.map((r) => (
              <option key={r} value={r}>
                {STUDENT_RESPONSE_LABELS[r]}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Next Class Plan" error={fieldErrors.next_class_plan}>
          <textarea
            className={inputClassName(!!fieldErrors.next_class_plan)}
            rows={2}
            value={nextClassPlan}
            onChange={(e) => setNextClassPlan(e.target.value)}
          />
        </FormField>

        <FormField label="Diary Status" error={fieldErrors.diary_status}>
          <SelectInput
            value={diaryStatus}
            onChange={(e) => handleDiaryStatusChange(e.target.value as DiaryStatus)}
            error={!!fieldErrors.diary_status}
          >
            {DIARY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DIARY_STATUS_LABELS[s]}
              </option>
            ))}
          </SelectInput>
        </FormField>

        {topicId && (
          <FormField
            label="Update Syllabus Progress"
            hint={
              syllabusStatusSuggested
                ? "Suggested based on diary status. Change to keep current if needed."
                : undefined
            }
            error={fieldErrors.syllabus_status_update}
          >
            <SelectInput
              value={syllabusStatusUpdate}
              onChange={(e) => {
                const next = e.target.value as SyllabusStatusUpdate;
                syllabusUpdateTouchedRef.current = true;
                setSyllabusStatusUpdate(next);
                setSyllabusStatusSuggested(
                  next !== "KEEP_CURRENT" &&
                    next === lastSyllabusSuggestionRef.current,
                );
              }}
              error={!!fieldErrors.syllabus_status_update}
            >
              {SYLLABUS_STATUS_UPDATES.map((s) => (
                <option key={s} value={s}>
                  {SYLLABUS_STATUS_UPDATE_LABELS[s]}
                </option>
              ))}
            </SelectInput>
          </FormField>
        )}

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

export default function TeachingDiaryForm({
  open,
  classId,
  subjects,
  entry,
  timetablePrefill,
  onClose,
  onSaved,
}: TeachingDiaryFormProps) {
  if (!open) return null;

  const dialogKey = entry?.id ?? timetablePrefill?.timetable_entry_id ?? "new";

  return (
    <TeachingDiaryFormDialog
      key={dialogKey}
      classId={classId}
      subjects={subjects}
      entry={entry}
      timetablePrefill={timetablePrefill}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
