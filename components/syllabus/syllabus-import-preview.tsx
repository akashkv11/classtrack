"use client";

import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Alert from "@/components/ui/alert";
import type { SyllabusImportPreviewData } from "@/lib/types/syllabus";

type SyllabusImportPreviewProps = {
  preview: SyllabusImportPreviewData;
  confirming: boolean;
  onConfirm: (importAsNewCopy: boolean) => void;
  onCancel: () => void;
};

export default function SyllabusImportPreview({
  preview,
  confirming,
  onConfirm,
  onCancel,
}: SyllabusImportPreviewProps) {
  const hasExisting = Boolean(preview.existing_subject);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Import Preview</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Class</dt>
            <dd className="text-slate-900">{preview.detected.class_grade ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Stream</dt>
            <dd className="text-slate-900">{preview.detected.stream ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Subject</dt>
            <dd className="text-slate-900">{preview.detected.subject ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Textbook</dt>
            <dd className="text-slate-900">{preview.detected.textbook_name ?? "—"}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Chapters found</p>
            <p className="text-xl font-bold text-slate-900">{preview.counts.chapters}</p>
          </div>
          <div>
            <p className="text-slate-500">Topics found</p>
            <p className="text-xl font-bold text-slate-900">{preview.counts.topics}</p>
          </div>
          <div>
            <p className="text-slate-500">Subtopics found</p>
            <p className="text-xl font-bold text-slate-900">{preview.counts.subtopics}</p>
          </div>
        </div>

        {preview.warnings.length > 0 && (
          <p className="mt-4 text-sm text-amber-700">
            Manual review warnings: {preview.warnings.length}
          </p>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Chapters to import</h3>
        <ol className="space-y-2 text-sm text-slate-700">
          {preview.chapters.map((chapter, index) => (
            <li key={`${chapter.chapter_number}-${chapter.chapter_title}`}>
              {index + 1}. {chapter.chapter_title}
              <span className="text-slate-500"> · {chapter.topics_count} topics</span>
            </li>
          ))}
        </ol>
      </Card>

      {preview.warnings.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-slate-900">Needs Manual Review</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Card>
      )}

      {hasExisting && (
        <Alert variant="warning">
          A syllabus already exists for {preview.existing_subject?.subject_name}. You can
          import as a new copy or cancel.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>
        {hasExisting ? (
          <Button
            variant="primary"
            onClick={() => onConfirm(true)}
            disabled={confirming}
          >
            {confirming ? "Importing…" : "Import as New Copy"}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => onConfirm(false)} disabled={confirming}>
            {confirming ? "Importing…" : "Confirm Import"}
          </Button>
        )}
      </div>
    </div>
  );
}
