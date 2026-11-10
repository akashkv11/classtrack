"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./timetable-content.css";
import TimetableEntryCard from "@/components/timetable/timetable-entry-card";
import TimetableScheduleActions from "@/components/timetable/timetable-schedule-actions";
import TimetableIcon from "@/components/timetable/timetable-icon";
import TimetableEntryForm, {
  type ClassOption,
  type TimetableFormValues,
  entryToFormValues,
} from "@/components/timetable/timetable-entry-form";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Modal from "@/components/ui/modal";
import { formatTodayHeading, parseISODate, todayISO } from "@/lib/dates";
import { getTimetableDay, getTimetableWeek, hideCompletedOneTimeEntries } from "@/lib/timetable-calendar";
import {
  filterTimetableEntries,
  formatTime12h,
  WEEKDAYS,
} from "@/lib/timetable";
import type { TimetableEntrySummary, TimetableOverlap } from "@/lib/types/timetable";
import type { DashboardTodayItem } from "@/lib/types/dashboard";
import type { FieldErrors } from "@/lib/validation";

type TimetableContentProps = {
  classes: ClassOption[];
  initialEntries: TimetableEntrySummary[];
  todayItems?: DashboardTodayItem[];
  today?: string;
  currentTime: string;
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
  todayItems = [],
  today = "",
  currentTime,
}: TimetableContentProps) {
  const router = useRouter();
  const [clock, setClock] = useState({ date: today || todayISO(), time: currentTime });
  const todayDate = clock.date;
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const date = todayISO();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setClock((previous) => previous.date === date && previous.time === time ? previous : { date, time });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [entries, setEntries] = useState(initialEntries);
  const [weekOffset, setWeekOffset] = useState(0);
  const [createDate, setCreateDate] = useState<string | null>(null);
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
    const subjects = new Set(hideCompletedOneTimeEntries(entries, clock.date, clock.time).map((entry) => entry.subject));
    return [...subjects].sort();
  }, [entries, clock.date, clock.time]);

  const filteredEntries = useMemo(
    () =>
      filterTimetableEntries(hideCompletedOneTimeEntries(entries, clock.date, clock.time), {
        classId: filterClassId || undefined,
        subject: filterSubject || undefined,
      }),
    [entries, filterClassId, filterSubject, clock.date, clock.time],
  );

  const weekDates = getTimetableWeek(todayDate, weekOffset);
  const weekDays = weekDates.map((date, index) => ({
    date, label: WEEKDAYS[index].label, periods: getTimetableDay(filteredEntries, date),
  }));
  const todayPeriods = getTimetableDay(filteredEntries, todayDate);
  const todayCards: DashboardTodayItem[] = todayPeriods.map(({ entry, start_time, end_time, is_exception }, index) => {
    const existing = todayItems.find((item) => item.entry_id === entry.id);
    return {
      entry_id: entry.id, period_number: existing?.period_number ?? index + 1,
      class_id: entry.class_id, class_name: entry.class_name, subject: entry.subject,
      start_time, end_time, schedule_type: entry.schedule_type, has_time_exception: is_exception,
      attendance_status: existing?.attendance_status ?? "not_marked",
      attendance_session_id: existing?.attendance_session_id ?? null,
      attendance_present: existing?.attendance_present ?? null,
      attendance_absent: existing?.attendance_absent ?? null,
      attendance_late: existing?.attendance_late ?? null,
      teaching_diary_status: existing?.teaching_diary_status ?? "pending",
      teaching_diary_entry_id: existing?.teaching_diary_entry_id ?? null,
      last_topic_taught: existing?.last_topic_taught ?? null,
      next_class_plan: existing?.next_class_plan ?? null,
      suggested_next_topic: existing?.suggested_next_topic ?? null,
      open_alerts_count: existing?.open_alerts_count ?? 0,
      top_alert_preview: existing?.top_alert_preview ?? null,
    };
  });
  const weekStartLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(parseISODate(weekDates[0]));
  const weekEndLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parseISODate(weekDates[6]));
  const allEntriesSorted = useMemo(
    () =>
      [...filteredEntries].sort((a, b) => {
        const timeCompare = a.start_time.localeCompare(b.start_time);
        if (timeCompare !== 0) return timeCompare;
        return a.class_name.localeCompare(b.class_name);
      }),
    [filteredEntries],
  );

  function openCreateForm(date?: string) {
    setCreateDate(date ?? null);
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
    setMessage("");
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
    router.refresh();

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
    router.refresh();
  }

  return (
    <div className="tt-workspace">
      <header className="tt-heading">
        <div>

          <h1>Timetable</h1>
          <p className="tt-subtitle">View and manage your class schedule.</p>
        </div>
        <Button type="button" onClick={() => openCreateForm()} disabled={classes.length === 0} className="tt-add-button">
          <TimetableIcon name="plus" size={17} /> Add Entry
        </Button>
      </header>

      {message && !showForm && <Alert variant="info" className="mb-5">{message}</Alert>}
      {classes.length === 0 && <Alert variant="info" className="mb-5">Add a class from the Classes page to start scheduling your periods.</Alert>}

      <section className="tt-planner" aria-labelledby="tt-planner-title">
        <div className="tt-planner-heading"><h2 id="tt-planner-title">{activeTab === "weekly" ? "Weekly schedule" : "All entries"}</h2><div className="tt-view-switch" role="group" aria-label="Timetable view">
          <button type="button" aria-pressed={activeTab === "weekly"} onClick={() => setActiveTab("weekly")}><TimetableIcon name="calendar" size={16} /> Week</button>
          <button type="button" aria-pressed={activeTab === "all"} onClick={() => setActiveTab("all")}><TimetableIcon name="list" size={16} /> All entries</button>
        </div></div>
        <div className="tt-toolbar">
          {activeTab === "weekly" ? <div className="tt-week-nav"><div className="tt-arrow-pair"><button type="button" aria-label="Previous week" onClick={() => setWeekOffset((offset) => offset - 1)}><TimetableIcon name="left" size={16} /></button><button type="button" aria-label="Next week" onClick={() => setWeekOffset((offset) => offset + 1)}><TimetableIcon name="right" size={16} /></button></div><span className="tt-week-label" aria-live="polite">{weekStartLabel} – {weekEndLabel}</span><button type="button" className="tt-this-week" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>This week</button></div> : <p className="tt-list-caption">{allEntriesSorted.length} entries · active and disabled schedules</p>}
          <div className="tt-filters">
            <label className="sr-only" htmlFor="tt-class-filter">Filter by class</label><select id="tt-class-filter" value={filterClassId} onChange={(event) => setFilterClassId(event.target.value)}><option value="">All classes</option>{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.displayName}</option>)}</select>
            <label className="sr-only" htmlFor="tt-subject-filter">Filter by subject</label><select id="tt-subject-filter" value={filterSubject} onChange={(event) => setFilterSubject(event.target.value)}><option value="">All subjects</option>{subjectOptions.map((subject) => <option key={subject}>{subject}</option>)}</select>
            {(filterClassId || filterSubject) && <button type="button" className="tt-clear-filters" onClick={() => { setFilterClassId(""); setFilterSubject(""); }}>Clear</button>}
          </div>
        </div>
        {activeTab === "weekly" ? <div className="tt-board-scroll" role="region" aria-label="Weekly timetable" tabIndex={0}>
          <div className="tt-week-board">{weekDays.map((day) => <section key={day.date} className={`tt-day ${day.date === todayDate ? "is-today" : ""}`} aria-label={`${day.label}, ${day.date}`}>
            <header className="tt-day-heading"><span>{day.label.slice(0, 3)}</span><strong>{parseISODate(day.date).getUTCDate()}</strong>{day.date === todayDate && <small>Today</small>}<span className="tt-day-count">{day.periods.length}</span></header>
            <div className="tt-day-content">{day.periods.map(({ entry, start_time, end_time, is_exception }) => <button type="button" key={entry.id} className="tt-week-card" onClick={() => openEditForm(entry)} aria-label={`Edit ${entry.class_name}, ${entry.subject}, ${day.date} at ${formatTime12h(start_time)}`}>
              <span className="tt-week-time">{formatTime12h(start_time)}</span><strong>{entry.class_name}</strong><span className="tt-week-subject">{entry.subject}</span><span className="tt-week-end">Until {formatTime12h(end_time)}</span>
              {is_exception && <span className="tt-exception-label">Time changed</span>}
              <span className="tt-card-footer"><span>{entry.schedule_type === "repeating" ? "↻ Weekly" : "One-time"}</span><TimetableIcon name="edit" size={13} /></span>
            </button>)}
            {day.periods.length === 0 && <div className="tt-free-day"><span>—</span><p>No classes</p><button type="button" disabled={classes.length === 0} onClick={() => openCreateForm(day.date)}>+ Add entry</button></div>}
            </div>
          </section>)}</div>
        </div> : <div className="tt-all-entries">
          {allEntriesSorted.length === 0 ? <div className="tt-empty-list"><TimetableIcon name="calendar" size={28} /><h3>No matching entries</h3><p>{filterClassId || filterSubject ? "Clear the filters or choose a different class or subject." : "Add your first period to start building your teaching week."}</p></div> : allEntriesSorted.map((entry) => <TimetableEntryCard key={entry.id} entry={entry} onEdit={openEditForm} onDisable={setDisableTarget} />)}
        </div>}
      </section>
      <details className="tt-today">
        <summary>Today’s class actions <span>({todayCards.length}) · {formatTodayHeading(todayDate)}</span></summary>
        {todayCards.length > 0 ? <div className="tt-focus-grid">
          {todayCards.map((item) => <article key={item.entry_id} className="tt-focus-card">
            <div className="tt-focus-top"><span className="tt-class-label">{item.class_name}</span><span className="tt-period-label">PERIOD {item.period_number}</span></div>
            <h3>{item.subject}</h3>
            <p className="tt-focus-time"><TimetableIcon name="clock" size={14} />{formatTime12h(item.start_time)} <span>—</span> {formatTime12h(item.end_time)}</p>
            {item.has_time_exception && <p className="tt-time-change">One-time timing change</p>}
            <div className="tt-status-line">
              <span className={item.attendance_status === "marked" ? "is-done" : "is-pending"}>{item.attendance_status === "marked" ? "✓ Attendance marked" : "○ Attendance pending"}</span>
              <span className={item.teaching_diary_status === "written" ? "is-done" : "is-pending"}>{item.teaching_diary_status === "written" ? "✓ Diary added" : "○ Diary pending"}</span>
            </div>
            <div className="tt-focus-actions"><TimetableScheduleActions item={item} date={todayDate} /></div>
          </article>)}
        </div> : <div className="tt-empty-today"><span className="tt-empty-icon"><TimetableIcon name="calendar" size={24} /></span><div><h3>{filterClassId || filterSubject ? "No matching classes today" : "No classes today"}</h3><p>{filterClassId || filterSubject ? "Try another class or subject filter, or explore your week below." : "No classes scheduled for today."}</p></div><button type="button" onClick={() => openCreateForm(todayDate)} disabled={classes.length === 0}>Add a class today <span aria-hidden="true">↗</span></button></div>}
      </details>


      <Modal open={showForm} onClose={() => { if (!saving) closeForm(); }} title={editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"} maxWidth="lg"
        footer={<p className="text-xs text-slate-500">One-time timing changes can be added for individual dates.</p>}
      >
        {showForm && <>
          {message && <Alert variant="error" className="mb-4">{message}</Alert>}
          <TimetableEntryForm key={editingEntry?.id ?? createDate ?? "new"} classes={classes}
            initialValues={editingEntry ? entryToFormValues(editingEntry) : createDate ? { schedule_type: "one_time", entry_date: createDate } : undefined}
            editingEntryId={editingEntry?.id} saving={saving} fieldErrors={fieldErrors} overlapWarning={overlapWarning}
            submitLabel={editingEntry ? "Update Entry" : "Save Entry"} onSubmit={handleSave} onCancel={closeForm} />
        </>}
      </Modal>

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
    </div>
  );
}
