"use client";

import { FormEvent, useMemo, useState } from "react";
import Alert from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormField, { CheckboxField, SelectInput, TextInput } from "@/components/ui/form-field";
import { todayISO } from "@/lib/dates";
import {
  sortScheduleExceptions,
  SUBJECTS_BY_STREAM,
  WEEKDAYS,
} from "@/lib/timetable";
import type {
  ScheduleType,
  TimetableEntrySummary,
  TimetableScheduleException,
} from "@/lib/types/timetable";
import { subjectForStream } from "@/lib/whatsapp";
import type { FieldErrors } from "@/lib/validation";

export type ClassOption = {
  id: string;
  displayName: string;
  stream: string;
};

export type TimetableFormValues = {
  class_id: string;
  subject: string;
  schedule_type: ScheduleType;
  entry_date: string;
  repeat_days: string[];
  repeat_start: string;
  repeat_end: string;
  start_time: string;
  end_time: string;
  schedule_exceptions: TimetableScheduleException[];
  notes: string;
};

type TimetableEntryFormProps = {
  classes: ClassOption[];
  initialValues?: Partial<TimetableFormValues>;
  editingEntryId?: string;
  submitLabel?: string;
  saving?: boolean;
  fieldErrors?: FieldErrors;
  overlapWarning?: string | null;
  onSubmit: (values: TimetableFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

const DEFAULT_TIMES = { start_time: "09:30", end_time: "10:15" };

function defaultSubject(classes: ClassOption[], classId: string): string {
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return "";
  const options = subjectsForClass(classes, classId);
  return options[0] ?? "";
}

function subjectsForClass(classes: ClassOption[], classId: string): string[] {
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return [];
  return (
    SUBJECTS_BY_STREAM[cls.stream] ??
    (subjectForStream(cls.stream) ? [subjectForStream(cls.stream)!] : [])
  );
}

function buildInitialValues(
  classes: ClassOption[],
  initialValues?: Partial<TimetableFormValues>,
): TimetableFormValues {
  const firstClassId = initialValues?.class_id ?? classes[0]?.id ?? "";
  return {
    class_id: firstClassId,
    subject: initialValues?.subject ?? defaultSubject(classes, firstClassId),
    schedule_type: initialValues?.schedule_type ?? "one_time",
    entry_date: initialValues?.entry_date ?? todayISO(),
    repeat_days: initialValues?.repeat_days ?? ["monday", "wednesday", "friday"],
    repeat_start: initialValues?.repeat_start ?? "2026-06-01",
    repeat_end: initialValues?.repeat_end ?? "2027-03-31",
    start_time: initialValues?.start_time ?? DEFAULT_TIMES.start_time,
    end_time: initialValues?.end_time ?? DEFAULT_TIMES.end_time,
    schedule_exceptions: initialValues?.schedule_exceptions ?? [],
    notes: initialValues?.notes ?? "",
  };
}

export function entryToFormValues(entry: TimetableEntrySummary): TimetableFormValues {
  return {
    class_id: entry.class_id,
    subject: entry.subject,
    schedule_type: entry.schedule_type,
    entry_date: entry.entry_date ?? todayISO(),
    repeat_days: entry.repeat_days.length ? entry.repeat_days : ["monday"],
    repeat_start: entry.repeat_start ?? "2026-06-01",
    repeat_end: entry.repeat_end ?? "2027-03-31",
    start_time: entry.start_time,
    end_time: entry.end_time,
    schedule_exceptions: entry.schedule_exceptions,
    notes: entry.notes ?? "",
  };
}

function exceptionFieldError(
  fieldErrors: FieldErrors,
  index: number,
  field: keyof TimetableScheduleException,
): string | undefined {
  return (
    fieldErrors[`schedule_exceptions.${index}.${field}`] ??
    fieldErrors[`schedule_exceptions.${index}`] ??
    fieldErrors.schedule_exceptions
  );
}

export default function TimetableEntryForm({
  classes,
  initialValues,
  editingEntryId,
  submitLabel = "Save Entry",
  saving = false,
  fieldErrors = {},
  overlapWarning,
  onSubmit,
  onCancel,
}: TimetableEntryFormProps) {
  const [values, setValues] = useState<TimetableFormValues>(() =>
    buildInitialValues(classes, initialValues),
  );

  const subjectOptions = useMemo(
    () => subjectsForClass(classes, values.class_id),
    [classes, values.class_id],
  );

  function handleClassChange(classId: string) {
    const options = subjectsForClass(classes, classId);
    setValues((prev) => ({
      ...prev,
      class_id: classId,
      subject: options.includes(prev.subject) ? prev.subject : (options[0] ?? ""),
    }));
  }

  function toggleRepeatDay(day: string) {
    setValues((prev) => ({
      ...prev,
      repeat_days: prev.repeat_days.includes(day)
        ? prev.repeat_days.filter((d) => d !== day)
        : [...prev.repeat_days, day],
    }));
  }

  function addScheduleException() {
    setValues((prev) => ({
      ...prev,
      schedule_exceptions: sortScheduleExceptions([
        ...prev.schedule_exceptions,
        {
          date: todayISO(),
          start_time: prev.start_time,
          end_time: prev.end_time,
        },
      ]),
    }));
  }

  function updateScheduleException(
    index: number,
    field: keyof TimetableScheduleException,
    value: string,
  ) {
    setValues((prev) => ({
      ...prev,
      schedule_exceptions: sortScheduleExceptions(
        prev.schedule_exceptions.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      ),
    }));
  }

  function removeScheduleException(index: number) {
    setValues((prev) => ({
      ...prev,
      schedule_exceptions: prev.schedule_exceptions.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Class" error={fieldErrors.class_id}>
        <SelectInput
          value={values.class_id}
          onChange={(e) => handleClassChange(e.target.value)}
          required
          disabled={classes.length === 0}
          error={!!fieldErrors.class_id}
        >
          {classes.length === 0 ? (
            <option value="">No classes available</option>
          ) : (
            classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.displayName}
              </option>
            ))
          )}
        </SelectInput>
      </FormField>

      <FormField label="Subject" error={fieldErrors.subject}>
        <SelectInput
          value={values.subject}
          onChange={(e) => setValues((prev) => ({ ...prev, subject: e.target.value }))}
          required
          disabled={subjectOptions.length === 0}
          error={!!fieldErrors.subject}
        >
          {subjectOptions.length === 0 ? (
            <option value="">Select a class first</option>
          ) : (
            subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          )}
        </SelectInput>
      </FormField>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-slate-700">
          Schedule Type
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={`scheduleType-${editingEntryId ?? "new"}`}
              value="one_time"
              checked={values.schedule_type === "one_time"}
              onChange={() =>
                setValues((prev) => ({ ...prev, schedule_type: "one_time" }))
              }
            />
            One-time class
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={`scheduleType-${editingEntryId ?? "new"}`}
              value="repeating"
              checked={values.schedule_type === "repeating"}
              onChange={() =>
                setValues((prev) => ({ ...prev, schedule_type: "repeating" }))
              }
            />
            Repeating class
          </label>
        </div>
      </fieldset>

      {values.schedule_type === "one_time" ? (
        <FormField label="Date" error={fieldErrors.entry_date}>
          <TextInput
            type="date"
            value={values.entry_date}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, entry_date: e.target.value }))
            }
            required
            error={!!fieldErrors.entry_date}
          />
        </FormField>
      ) : (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Repeat Days</p>
            {fieldErrors.repeat_days && (
              <p className="mb-2 text-sm text-red-600">{fieldErrors.repeat_days}</p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WEEKDAYS.map((day) => (
                <CheckboxField
                  key={day.value}
                  label={day.label}
                  checked={values.repeat_days.includes(day.value)}
                  onChange={() => toggleRepeatDay(day.value)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Repeat Starts On" error={fieldErrors.repeat_start}>
              <TextInput
                type="date"
                value={values.repeat_start}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, repeat_start: e.target.value }))
                }
                required
                error={!!fieldErrors.repeat_start}
              />
            </FormField>
            <FormField label="Repeat Ends On" error={fieldErrors.repeat_end}>
              <TextInput
                type="date"
                value={values.repeat_end}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, repeat_end: e.target.value }))
                }
                required
                error={!!fieldErrors.repeat_end}
              />
            </FormField>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={values.schedule_type === "repeating" ? "Regular Start Time" : "Start Time"}
          error={fieldErrors.start_time}
        >
          <TextInput
            type="time"
            value={values.start_time}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, start_time: e.target.value }))
            }
            required
            error={!!fieldErrors.start_time}
          />
        </FormField>
        <FormField
          label={values.schedule_type === "repeating" ? "Regular End Time" : "End Time"}
          error={fieldErrors.end_time}
        >
          <TextInput
            type="time"
            value={values.end_time}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, end_time: e.target.value }))
            }
            required
            error={!!fieldErrors.end_time}
          />
        </FormField>
      </div>

      {values.schedule_type === "repeating" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-700">One-time time changes</p>
              <p className="text-xs text-slate-500">
                Use this when a regular class moves to a different time on a specific date.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addScheduleException}>
              Add change
            </Button>
          </div>

          {values.schedule_exceptions.length === 0 ? (
            <p className="text-sm text-slate-500">No one-time time changes added.</p>
          ) : (
            <div className="space-y-3">
              {values.schedule_exceptions.map((exception, index) => (
                <div
                  key={`${exception.date}-${index}`}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      label="Date"
                      error={exceptionFieldError(fieldErrors, index, "date")}
                    >
                      <TextInput
                        type="date"
                        value={exception.date}
                        onChange={(e) =>
                          updateScheduleException(index, "date", e.target.value)
                        }
                        required
                        error={!!exceptionFieldError(fieldErrors, index, "date")}
                      />
                    </FormField>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        label="Start Time"
                        error={exceptionFieldError(fieldErrors, index, "start_time")}
                      >
                        <TextInput
                          type="time"
                          value={exception.start_time}
                          onChange={(e) =>
                            updateScheduleException(index, "start_time", e.target.value)
                          }
                          required
                          error={!!exceptionFieldError(fieldErrors, index, "start_time")}
                        />
                      </FormField>
                      <FormField
                        label="End Time"
                        error={exceptionFieldError(fieldErrors, index, "end_time")}
                      >
                        <TextInput
                          type="time"
                          value={exception.end_time}
                          onChange={(e) =>
                            updateScheduleException(index, "end_time", e.target.value)
                          }
                          required
                          error={!!exceptionFieldError(fieldErrors, index, "end_time")}
                        />
                      </FormField>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeScheduleException(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <FormField label="Notes" hint="Optional" error={fieldErrors.notes}>
        <TextInput
          value={values.notes}
          onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Optional notes"
          error={!!fieldErrors.notes}
        />
      </FormField>

      {overlapWarning && <Alert variant="warning">{overlapWarning}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={classes.length === 0 || saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export { subjectsForClass };
