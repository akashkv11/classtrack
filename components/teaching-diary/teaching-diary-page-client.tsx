"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TeachingDiaryCard from "@/components/teaching-diary/teaching-diary-card";
import TeachingDiaryForm from "@/components/teaching-diary/teaching-diary-form";
import TeachingDiarySummaryCards from "@/components/teaching-diary/teaching-diary-summary-cards";
import ActionBar, { actionButtonClassName } from "@/components/ui/action-bar";
import Alert from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import FormField, { SelectInput } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/loading-state";
import Card from "@/components/ui/card";
import { todayISO } from "@/lib/dates";
import { DIARY_STATUS_LABELS } from "@/lib/teaching-diary/status";
import type {
  DiaryStatus,
  TeachingDiaryEntrySummary,
  TeachingDiaryListResponse,
} from "@/lib/types/teaching-diary";
import type { SyllabusSubjectSummary } from "@/lib/types/syllabus";

type DateRangePreset = "this_month" | "last_month" | "all";

type TeachingDiaryPageClientProps = {
  classId: string;
  initialSubjects: SyllabusSubjectSummary[];
  initialData: TeachingDiaryListResponse;
};

function getMonthRange(preset: DateRangePreset): {
  dateFrom?: string;
  dateTo?: string;
} {
  const now = new Date();
  if (preset === "all") return {};

  const year = now.getFullYear();
  const month = now.getMonth();

  if (preset === "this_month") {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return {
      dateFrom: formatLocalISO(from),
      dateTo: formatLocalISO(to),
    };
  }

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return {
    dateFrom: formatLocalISO(from),
    dateTo: formatLocalISO(to),
  };
}

function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DIARY_STATUSES = Object.keys(DIARY_STATUS_LABELS) as DiaryStatus[];

export default function TeachingDiaryPageClient({
  classId,
  initialSubjects,
  initialData,
}: TeachingDiaryPageClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialData.entries);
  const [summary, setSummary] = useState(initialData.summary);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRangePreset>("this_month");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<TeachingDiaryEntrySummary | null>(null);
  const [deletingEntry, setDeletingEntry] =
    useState<TeachingDiaryEntrySummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const refreshEntries = useCallback(async () => {
    const range = getMonthRange(dateRange);
    const params = new URLSearchParams();
    if (subjectFilter) params.set("subject_id", subjectFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (range.dateFrom) params.set("date_from", range.dateFrom);
    if (range.dateTo) params.set("date_to", range.dateTo);

    const res = await fetch(
      `/api/classes/${classId}/teaching-diary?${params.toString()}`,
    );
    if (!res.ok) return;
    const data: TeachingDiaryListResponse = await res.json();
    setEntries(data.entries);
    setSummary(data.summary);
  }, [classId, subjectFilter, dateRange, statusFilter]);

  const hasSyllabus = initialSubjects.length > 0;

  const emptyMessage = useMemo(() => {
    if (!hasSyllabus) {
      return {
        title: "No syllabus found for this class.",
        description:
          "Teaching Diary works best after adding syllabus topics. You can still create diary entries manually.",
      };
    }
    return {
      title: "No teaching diary entries yet.",
      description:
        "Start recording what you teach each day. You can link each diary entry to a syllabus topic and update progress.",
    };
  }, [hasSyllabus]);

  async function handleFilterChange() {
    await refreshEntries();
  }

  async function handleSaved() {
    await refreshEntries();
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingEntry) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teaching-diary/${deletingEntry.id}?class_id=${classId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete entry");
      }
      setDeletingEntry(null);
      await handleSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ActionBar>
        <Button
          type="button"
          variant="primary"
          className={`${actionButtonClassName} mb-4`}
          onClick={() => {
            setEditingEntry(null);
            setShowForm(true);
          }}
        >
          Add Diary Entry
        </Button>
      </ActionBar>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {hasSyllabus && (
            <FormField label="Subject">
              <SelectInput
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">All Subjects</option>
                {initialSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}
          <FormField label="Date Range">
            <SelectInput
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="all">All Time</option>
            </SelectInput>
          </FormField>
          <FormField label="Status">
            <SelectInput
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {DIARY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DIARY_STATUS_LABELS[s]}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleFilterChange}
          >
            Apply Filters
          </Button>
        </div>
      </Card>

      <TeachingDiarySummaryCards summary={summary} />

      {entries.length === 0 ? (
        <div className="text-center">
          <EmptyState
            message={`${emptyMessage.title} ${emptyMessage.description}`}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!hasSyllabus && (
              <ButtonLink
                href={`/classes/${classId}/syllabus`}
                variant="secondary"
              >
                Add Syllabus
              </ButtonLink>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setEditingEntry(null);
                setShowForm(true);
              }}
            >
              {hasSyllabus
                ? "Add Diary Entry"
                : "Create Diary Without Syllabus"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <TeachingDiaryCard
              key={entry.id}
              entry={entry}
              onEdit={(e) => {
                setEditingEntry(e);
                setShowForm(true);
              }}
              onDelete={setDeletingEntry}
            />
          ))}
        </div>
      )}

      <TeachingDiaryForm
        open={showForm}
        classId={classId}
        subjects={initialSubjects}
        entry={editingEntry}
        onClose={() => {
          setShowForm(false);
          setEditingEntry(null);
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingEntry)}
        title="Delete diary entry?"
        description={`Delete the entry from ${deletingEntry?.entry_date ?? todayISO()}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingEntry(null)}
      />
    </>
  );
}
