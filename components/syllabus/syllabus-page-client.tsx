"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ChapterForm from "@/components/syllabus/chapter-form";
import TopicForm from "@/components/syllabus/topic-form";
import EditSubjectForm from "@/components/syllabus/edit-subject-form";
import SyllabusChapterCard from "@/components/syllabus/syllabus-chapter-card";
import SyllabusSummaryCards from "@/components/syllabus/syllabus-summary-cards";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import FormField, { SelectInput, TextInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/loading-state";
import Card from "@/components/ui/card";
import type {
  SyllabusChapterSummary,
  SyllabusSubjectDetail,
  SyllabusSubjectSummary,
} from "@/lib/types/syllabus";

type SyllabusPageClientProps = {
  classId: string;
  initialSubjects: SyllabusSubjectSummary[];
  initialSubjectDetail: SyllabusSubjectDetail | null;
};

export default function SyllabusPageClient({
  classId,
  initialSubjects,
  initialSubjectDetail,
}: SyllabusPageClientProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState(initialSubjects);
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    initialSubjectDetail?.id ?? initialSubjects[0]?.id ?? "",
  );
  const [subjectDetail, setSubjectDetail] = useState<SyllabusSubjectDetail | null>(
    initialSubjectDetail,
  );
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<SyllabusChapterSummary | null>(
    null,
  );
  const [deletingChapter, setDeletingChapter] = useState<SyllabusChapterSummary | null>(
    null,
  );
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [showDeleteSubject, setShowDeleteSubject] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [deletingChapterLoading, setDeletingChapterLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("Computer Applications");
  const [error, setError] = useState("");

  const refreshSubjects = useCallback(async () => {
    const res = await fetch(`/api/classes/${classId}/syllabus`);
    if (!res.ok) return;
    const data = await res.json();
    setSubjects(data.subjects ?? []);
    return data.subjects as SyllabusSubjectSummary[];
  }, [classId]);

  const refreshSubjectDetail = useCallback(
    async (subjectId: string) => {
      const res = await fetch(`/api/classes/${classId}/syllabus/${subjectId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSubjectDetail(data);
    },
    [classId],
  );

  async function handleSubjectChange(subjectId: string) {
    setSelectedSubjectId(subjectId);
    if (subjectId) {
      await refreshSubjectDetail(subjectId);
    } else {
      setSubjectDetail(null);
    }
  }

  async function handleCreateSubject() {
    setCreatingSubject(true);
    setError("");
    try {
      const res = await fetch(`/api/classes/${classId}/syllabus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_name: newSubjectName.trim() || "New Subject" }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Failed to create subject");

      const updated = await refreshSubjects();
      const newSubject = updated?.find((s) => s.id === payload.subject.id);
      if (newSubject) {
        setSelectedSubjectId(newSubject.id);
        await refreshSubjectDetail(newSubject.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setCreatingSubject(false);
    }
  }

  async function handleSaved() {
    const updated = await refreshSubjects();
    if (selectedSubjectId) {
      await refreshSubjectDetail(selectedSubjectId);
    } else if (updated?.[0]) {
      setSelectedSubjectId(updated[0].id);
      await refreshSubjectDetail(updated[0].id);
    }
    router.refresh();
  }

  async function handleDeleteSubject() {
    if (!selectedSubjectId) return;
    setDeletingSubject(true);
    setError("");
    try {
      const res = await fetch(
        `/api/syllabus/${selectedSubjectId}?class_id=${classId}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to delete syllabus");

      setShowDeleteSubject(false);
      const updated = await refreshSubjects();
      const nextSubject = updated?.[0];
      if (nextSubject) {
        setSelectedSubjectId(nextSubject.id);
        await refreshSubjectDetail(nextSubject.id);
      } else {
        setSelectedSubjectId("");
        setSubjectDetail(null);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete syllabus");
    } finally {
      setDeletingSubject(false);
    }
  }

  async function handleDeleteChapter() {
    if (!deletingChapter) return;
    setDeletingChapterLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/syllabus/chapters/${deletingChapter.id}?class_id=${classId}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to delete chapter");

      setDeletingChapter(null);
      await handleSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chapter");
    } finally {
      setDeletingChapterLoading(false);
    }
  }

  const emptyState = subjects.length === 0;

  return (
    <>
      <ActionBar className="mb-6">
        <ButtonLink
          href={`/classes/${classId}/syllabus/import`}
          variant="primary"
          className={actionButtonClassName}
        >
          Import Syllabus
        </ButtonLink>
        {selectedSubjectId && (
          <>
            <Button
              variant="secondary"
              className={actionButtonClassName}
              onClick={() => setShowAddChapter(true)}
            >
              Add Chapter
            </Button>
            <Button
              variant="secondary"
              className={actionButtonClassName}
              onClick={() => setShowAddTopic(true)}
            >
              Add Topic
            </Button>
            <Button
              variant="secondary"
              className={actionButtonClassName}
              onClick={() => setShowEditSubject(true)}
            >
              Edit Subject
            </Button>
            <Button
              variant="danger"
              className={actionButtonClassName}
              onClick={() => setShowDeleteSubject(true)}
            >
              Delete Syllabus
            </Button>
          </>
        )}
      </ActionBar>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!emptyState && (
        <div className="mb-6 max-w-sm">
          <FormField label="Subject">
            <SelectInput
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      )}

      {emptyState ? (
        <Card>
          <EmptyState message="No syllabus yet. Import a JSON file or add a subject manually to start tracking progress." />
          <div className="mt-4 space-y-3">
            <FormField label="Subject name">
              <TextInput
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/classes/${classId}/syllabus/import`} variant="primary">
                Import Syllabus
              </ButtonLink>
              <Button
                variant="secondary"
                onClick={handleCreateSubject}
                disabled={creatingSubject}
              >
                {creatingSubject ? "Creating…" : "Add Subject Manually"}
              </Button>
            </div>
          </div>
        </Card>
      ) : subjectDetail ? (
        <>
          <SyllabusSummaryCards summary={subjectDetail.summary} />
          <div className="space-y-4">
            {subjectDetail.chapters.map((chapter) => (
              <SyllabusChapterCard
                key={chapter.id}
                classId={classId}
                chapter={chapter}
                onEdit={setEditingChapter}
                onDelete={setDeletingChapter}
              />
            ))}
          </div>
        </>
      ) : null}

      {selectedSubjectId && subjectDetail && (
        <>
          <ChapterForm
            open={showAddChapter}
            classId={classId}
            subjectId={selectedSubjectId}
            onClose={() => setShowAddChapter(false)}
            onSaved={handleSaved}
          />
          <ChapterForm
            open={Boolean(editingChapter)}
            classId={classId}
            subjectId={selectedSubjectId}
            chapter={editingChapter}
            onClose={() => setEditingChapter(null)}
            onSaved={handleSaved}
          />
          <TopicForm
            open={showAddTopic}
            classId={classId}
            chapters={subjectDetail.chapters.map((ch) => ({
              id: ch.id,
              chapter_number: ch.chapter_number,
              chapter_title: ch.chapter_title,
            }))}
            onClose={() => setShowAddTopic(false)}
            onSaved={handleSaved}
          />
          <EditSubjectForm
            open={showEditSubject}
            classId={classId}
            subjectId={selectedSubjectId}
            initial={{
              subject_name: subjectDetail.subject_name,
              stream: subjectDetail.stream ?? "",
              textbook_name: subjectDetail.textbook_name ?? "",
              board: subjectDetail.board ?? "",
              academic_year: subjectDetail.academic_year ?? "",
            }}
            onClose={() => setShowEditSubject(false)}
            onSaved={handleSaved}
          />
          <ConfirmDialog
            open={showDeleteSubject}
            title="Delete entire syllabus?"
            description={
              <>
                This will permanently delete <strong>{subjectDetail.subject_name}</strong>,
                including all chapters and topics. This cannot be undone.
              </>
            }
            confirmLabel="Delete Syllabus"
            confirmVariant="danger"
            loading={deletingSubject}
            onConfirm={handleDeleteSubject}
            onCancel={() => setShowDeleteSubject(false)}
          />
          <ConfirmDialog
            open={Boolean(deletingChapter)}
            title="Delete chapter?"
            description={
              deletingChapter ? (
                <>
                  Delete <strong>{deletingChapter.chapter_title}</strong> and all of its
                  topics? This cannot be undone.
                </>
              ) : null
            }
            confirmLabel="Delete Chapter"
            confirmVariant="danger"
            loading={deletingChapterLoading}
            onConfirm={handleDeleteChapter}
            onCancel={() => setDeletingChapter(null)}
          />
        </>
      )}
    </>
  );
}
