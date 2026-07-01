"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SyllabusTopicDetails from "@/components/syllabus/syllabus-topic-details";
import SyllabusTopicList from "@/components/syllabus/syllabus-topic-list";
import ChapterForm from "@/components/syllabus/chapter-form";
import TopicForm from "@/components/syllabus/topic-form";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { SyllabusProgressPanel } from "@/components/syllabus/syllabus-progress-bar";
import PageContainer from "@/components/ui/page-container";
import PageHeader from "@/components/ui/page-header";
import { useClass } from "@/components/classes/class-provider";
import { useClientEffect } from "@/lib/use-client-effect";
import LoadingState from "@/components/ui/loading-state";
import type { SyllabusChapterDetail, SyllabusTopic } from "@/lib/types/syllabus";

export default function ChapterDetailPageClient() {
  const params = useParams<{ classId: string; chapterId: string }>();
  const router = useRouter();
  const { displayName } = useClass();
  const [chapter, setChapter] = useState<SyllabusChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<SyllabusTopic | null>(null);
  const [editingTopic, setEditingTopic] = useState<SyllabusTopic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<SyllabusTopic | null>(null);
  const [showEditChapter, setShowEditChapter] = useState(false);
  const [showDeleteChapter, setShowDeleteChapter] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);
  const [deletingTopicLoading, setDeletingTopicLoading] = useState(false);
  const [deletingChapterLoading, setDeletingChapterLoading] = useState(false);

  const loadChapter = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/syllabus/chapters/${params.chapterId}?class_id=${params.classId}`,
      { signal },
    );
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load chapter");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setChapter(data);
    setLoading(false);
  }, [params.chapterId, params.classId]);

  useClientEffect((signal) => loadChapter(signal), [loadChapter]);

  async function updateTopicStatus(topicId: string, status: string) {
    setUpdatingTopicId(topicId);
    setError("");
    try {
      const res = await fetch(
        `/api/syllabus/topics/${topicId}/status?class_id=${params.classId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to update status");
      }
      const payload = await res.json();
      setChapter((prev) =>
        prev
          ? {
              ...prev,
              topics: prev.topics.map((t) =>
                t.id === topicId ? { ...t, ...payload.topic } : t,
              ),
            }
          : prev,
      );
      if (selectedTopic?.id === topicId) {
        setSelectedTopic((prev) => (prev ? { ...prev, ...payload.topic } : prev));
      }
      await loadChapter();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingTopicId(null);
    }
  }

  async function handleDeleteTopic() {
    if (!deletingTopic) return;
    setDeletingTopicLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/syllabus/topics/${deletingTopic.id}?class_id=${params.classId}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to delete topic");

      setDeletingTopic(null);
      setSelectedTopic(null);
      await loadChapter();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete topic");
    } finally {
      setDeletingTopicLoading(false);
    }
  }

  async function handleDeleteChapter() {
    setDeletingChapterLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/syllabus/chapters/${params.chapterId}?class_id=${params.classId}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to delete chapter");

      router.push(`/classes/${params.classId}/syllabus`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chapter");
    } finally {
      setDeletingChapterLoading(false);
    }
  }

  const chapterLabel = chapter
    ? chapter.chapter_number
      ? `Chapter ${chapter.chapter_number}: ${chapter.chapter_title}`
      : chapter.chapter_title
    : "Chapter";

  const chapterSummaryForForm = chapter
    ? {
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        chapter_title: chapter.chapter_title,
        chapter_summary: chapter.chapter_summary,
        display_order: chapter.display_order,
        progress_percentage: chapter.progress.progress_percentage,
        topics_count: chapter.topics.length,
        subtopics_count: 0,
        status_summary: chapter.progress,
        topics: chapter.topics,
      }
    : null;

  return (
    <PageContainer>
      <PageHeader
        title={chapterLabel}
        subtitle={chapter ? `${displayName} · ${chapter.subject_name}` : displayName}
        backHref={`/classes/${params.classId}/syllabus`}
        backLabel="← Back to Syllabus"
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState message="Loading chapter…" />
      ) : chapter ? (
        <>
          <ActionBar className="mb-6">
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
              onClick={() => setShowEditChapter(true)}
            >
              Edit Chapter
            </Button>
            <Button
              variant="danger"
              className={actionButtonClassName}
              onClick={() => setShowDeleteChapter(true)}
            >
              Delete Chapter
            </Button>
          </ActionBar>

          {chapter.chapter_summary && (
            <Card className="mb-6">
              <h2 className="mb-2 text-sm font-medium text-slate-700">Summary</h2>
              <p className="text-sm text-slate-600">{chapter.chapter_summary}</p>
            </Card>
          )}

          <Card className="mb-6">
            <SyllabusProgressPanel breakdown={chapter.progress} showLegend />
          </Card>

          <SyllabusTopicList
            topics={chapter.topics}
            onStatusChange={updateTopicStatus}
            onSelectTopic={setSelectedTopic}
            onEditTopic={setEditingTopic}
            onDeleteTopic={setDeletingTopic}
            updatingTopicId={updatingTopicId}
          />

          <SyllabusTopicDetails
            open={Boolean(selectedTopic)}
            topic={selectedTopic}
            chapterTitle={chapter.chapter_title}
            onClose={() => setSelectedTopic(null)}
            onEdit={() => {
              if (selectedTopic) setEditingTopic(selectedTopic);
            }}
            onStatusChange={async (status) => {
              if (selectedTopic) {
                await updateTopicStatus(selectedTopic.id, status);
              }
            }}
            updating={updatingTopicId === selectedTopic?.id}
          />

          <ChapterForm
            open={showEditChapter}
            classId={params.classId}
            subjectId={chapter.subject_id}
            chapter={chapterSummaryForForm}
            onClose={() => setShowEditChapter(false)}
            onSaved={() => loadChapter()}
          />

          <TopicForm
            open={showAddTopic}
            classId={params.classId}
            chapters={[
              {
                id: chapter.id,
                chapter_number: chapter.chapter_number,
                chapter_title: chapter.chapter_title,
              },
            ]}
            defaultChapterId={chapter.id}
            onClose={() => setShowAddTopic(false)}
            onSaved={() => loadChapter()}
          />

          <TopicForm
            open={Boolean(editingTopic)}
            classId={params.classId}
            chapters={[
              {
                id: chapter.id,
                chapter_number: chapter.chapter_number,
                chapter_title: chapter.chapter_title,
              },
            ]}
            defaultChapterId={chapter.id}
            topic={editingTopic}
            onClose={() => setEditingTopic(null)}
            onSaved={() => loadChapter()}
          />

          <ConfirmDialog
            open={Boolean(deletingTopic)}
            title="Delete topic?"
            description={
              deletingTopic ? (
                <>
                  Delete <strong>{deletingTopic.topic_title}</strong>? This cannot be
                  undone.
                </>
              ) : null
            }
            confirmLabel="Delete Topic"
            confirmVariant="danger"
            loading={deletingTopicLoading}
            onConfirm={handleDeleteTopic}
            onCancel={() => setDeletingTopic(null)}
          />

          <ConfirmDialog
            open={showDeleteChapter}
            title="Delete chapter?"
            description={
              <>
                Delete <strong>{chapter.chapter_title}</strong> and all of its topics?
                This cannot be undone.
              </>
            }
            confirmLabel="Delete Chapter"
            confirmVariant="danger"
            loading={deletingChapterLoading}
            onConfirm={handleDeleteChapter}
            onCancel={() => setShowDeleteChapter(false)}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
