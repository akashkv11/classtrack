"use client";

import { useMemo, useState } from "react";
import TimetableEntryCard from "@/components/timetable/timetable-entry-card";
import TimetableEntryForm, {
  type ClassOption,
  type TimetableFormValues,
  entryToFormValues,
} from "@/components/timetable/timetable-entry-form";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import PageHeader from "@/components/ui/page-header";
import Tabs from "@/components/ui/tabs";
import FormField, { SelectInput } from "@/components/ui/form-field";
import {
  filterTimetableEntries,
  formatRepeatDays,
  formatScheduleExceptionsSummary,
  formatTime12h,
  groupEntriesByWeekday,
  WEEKDAYS,
} from "@/lib/timetable";
import type { TimetableEntrySummary, TimetableOverlap } from "@/lib/types/timetable";
import type { FieldErrors } from "@/lib/validation";

type TimetableContentProps = {
  classes: ClassOption[];
  initialEntries: TimetableEntrySummary[];
};

type ViewTab = "weekly" | "all";

function overlapMessage(overlaps: TimetableOverlap[]): string | null {
  if (overlaps.length === 0) return null;
  const first = overlaps[0];
  const dateLabel = first.date ? `${first.date} · ` : "";
  return `This overlaps with ${dateLabel}${first.class_name} · ${first.subject} (${formatTime12h(first.start_time)} – ${formatTime12h(first.end_time)}).`;
}

function formValuesToPayload(values: TimetableFormValues) {
  return {
    class_id: values.class_id,
    subject: values.subject,
    schedule_type: values.schedule_type,
    start_time: values.start_time,
    end_time: values.end_time,
    notes: values.notes.trim() || undefined,
    ...(values.schedule_type === "one_time"
      ? { entry_date: values.entry_date }
      : {
          repeat_days: values.repeat_days,
          repeat_start: values.repeat_start,
          repeat_end: values.repeat_end,
          schedule_exceptions: values.schedule_exceptions,
        }),
  };
}

export default function TimetableContent({
  classes,
  initialEntries,
}: TimetableContentProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [activeTab, setActiveTab] = useState<ViewTab>("weekly");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntrySummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [disableTarget, setDisableTarget] = useState<TimetableEntrySummary | null>(null);
  const [disabling, setDisabling] = useState(false);

  const subjectOptions = useMemo(() => {
    const subjects = new Set(entries.map((entry) => entry.subject));
    return [...subjects].sort();
  }, [entries]);

  const filteredEntries = useMemo(
    () =>
      filterTimetableEntries(entries, {
        classId: filterClassId || undefined,
        subject: filterSubject || undefined,
      }),
    [entries, filterClassId, filterSubject],
  );

  const weeklyGrouped = useMemo(
    () => groupEntriesByWeekday(filteredEntries, { activeOnly: true }),
    [filteredEntries],
  );

  const allEntriesSorted = useMemo(
    () =>
      [...filteredEntries].sort((a, b) => {
        const timeCompare = a.start_time.localeCompare(b.start_time);
        if (timeCompare !== 0) return timeCompare;
        return a.class_name.localeCompare(b.class_name);
      }),
    [filteredEntries],
  );

  function openCreateForm() {
    setEditingEntry(null);
    setFieldErrors({});
    setMessage("");
    setOverlapWarning(null);
    setShowForm(true);
  }

  function openEditForm(entry: TimetableEntrySummary) {
    setEditingEntry(entry);
    setFieldErrors({});
    setMessage("");
    setOverlapWarning(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingEntry(null);
    setFieldErrors({});
    setOverlapWarning(null);
  }

  async function handleSave(values: TimetableFormValues) {
    setSaving(true);
    setMessage("");
    setFieldErrors({});
    setOverlapWarning(null);

    const payload = formValuesToPayload(values);
    const url = editingEntry ? `/api/timetable/${editingEntry.id}` : "/api/timetable";
    const method = editingEntry ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to save timetable entry.");
      if (data.field_errors) setFieldErrors(data.field_errors);
      return;
    }

    const savedEntry = data.entry as TimetableEntrySummary;
    const overlaps = (data.overlaps ?? []) as TimetableOverlap[];

    setEntries((prev) => {
      const without = prev.filter((entry) => entry.id !== savedEntry.id);
      return [...without, savedEntry].sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      );
    });

    closeForm();

    if (overlaps.length > 0) {
      setMessage(
        `Entry saved. ${overlapMessage(overlaps)}`,
      );
    } else {
      setMessage(editingEntry ? "Entry updated." : "Entry saved.");
    }
  }

  async function confirmDisable() {
    if (!disableTarget) return;

    setDisabling(true);
    const entry = disableTarget;

    const res = await fetch(`/api/timetable/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });

    const data = await res.json().catch(() => ({}));
    setDisabling(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to disable entry.");
      return;
    }

    const savedEntry = data.entry as TimetableEntrySummary;
    setEntries((prev) =>
      prev.map((item) => (item.id === savedEntry.id ? savedEntry : item)),
    );
    setDisableTarget(null);
    setMessage("Entry disabled.");
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Timetable"
          subtitle="Your full teaching schedule — classes, subjects, and periods."
        />
        <Button
          type="button"
          variant="primary"
          className="shrink-0"
          onClick={() => (showForm ? closeForm() : openCreateForm())}
        >
          {showForm ? "Cancel" : "Add Entry"}
        </Button>
      </div>

      {message && (
        <Alert variant={overlapWarning ? "warning" : "info"} className="mb-4">
          {message}
        </Alert>
      )}

      {showForm && (
        <Card padding="lg" className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
          </h2>
          <TimetableEntryForm
            key={editingEntry?.id ?? "new"}
            classes={classes}
            initialValues={
              editingEntry ? entryToFormValues(editingEntry) : undefined
            }
            editingEntryId={editingEntry?.id}
            saving={saving}
            fieldErrors={fieldErrors}
            overlapWarning={overlapWarning}
            submitLabel={editingEntry ? "Update Entry" : "Save Entry"}
            onSubmit={handleSave}
            onCancel={closeForm}
          />
        </Card>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <FormField label="Filter by class">
          <SelectInput
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
          >
            <option value="">All classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.displayName}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Filter by subject">
          <SelectInput
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </div>

      <Tabs
        tabs={[
          { id: "weekly", label: "Weekly" },
          { id: "all", label: "All Entries" },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as ViewTab)}
      />

      {activeTab === "weekly" ? (
        <div className="space-y-6">
          {WEEKDAYS.map((day) => {
            const dayEntries = weeklyGrouped[day.value];
            return (
              <section key={day.value}>
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                  {day.label}
                </h2>
                {dayEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">No entries scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {dayEntries.map((entry) => (
                      <TimetableEntryCard
                        key={`${day.value}-${entry.id}`}
                        entry={entry}
                        onEdit={openEditForm}
                        onDisable={setDisableTarget}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {allEntriesSorted.length === 0 ? (
            <p className="text-sm text-slate-500">No timetable entries yet.</p>
          ) : (
            allEntriesSorted.map((entry) => (
              <Card key={entry.id} padding="sm" className={!entry.is_active ? "opacity-60" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {entry.class_name} · {entry.subject}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.schedule_type === "repeating"
                        ? `Repeats ${formatRepeatDays(entry.repeat_days)}`
                        : entry.entry_date
                          ? `One-time · ${entry.entry_date}`
                          : "One-time"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatTime12h(entry.start_time)} – {formatTime12h(entry.end_time)}
                    </p>
                    {entry.schedule_exceptions.length > 0 && (
                      <p className="mt-1 text-xs text-amber-800">
                        One-time changes: {formatScheduleExceptionsSummary(entry)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.is_active ? "Active" : "Disabled"}
                    </p>
                  </div>
                  {entry.is_active && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditForm(entry)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setDisableTarget(entry)}
                      >
                        Disable
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={disableTarget !== null}
        title="Disable timetable entry?"
        description={
          disableTarget
            ? `Disable ${disableTarget.class_name} · ${disableTarget.subject}? This entry will no longer appear in your schedule.`
            : ""
        }
        confirmLabel="Disable"
        confirmVariant="danger"
        loading={disabling}
        onConfirm={confirmDisable}
        onCancel={() => setDisableTarget(null)}
      />
    </>
  );
}
