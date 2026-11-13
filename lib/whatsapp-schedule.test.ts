import assert from "node:assert/strict";
import test from "node:test";
import { getWhatsAppScheduleOptions, resolveWhatsAppSchedule } from "./whatsapp-schedule";
import type { TimetableEntrySummary } from "./types/timetable";

const entry: TimetableEntrySummary = {
  id: "period", class_id: "class", class_name: "Class", subject: "Science",
  schedule_type: "repeating", entry_date: null, start_time: "09:30", end_time: "10:30",
  repeat_days: ["wednesday"], repeat_start: "2026-11-01", repeat_end: "2026-12-01",
  schedule_exceptions: [{ date: "2026-11-11", start_time: "14:00", end_time: "15:00" }],
  notes: null, is_active: true,
};

test("unlinked sessions use the sole matching period and its date override", () => {
  assert.equal(resolveWhatsAppSchedule(null, [entry], "2026-11-11")?.start_time, "14:00");
  assert.equal(resolveWhatsAppSchedule(null, [entry], "2026-11-18")?.start_time, "09:30");
});

test("unlinked sessions do not guess between periods or use another day's period", () => {
  assert.equal(resolveWhatsAppSchedule(null, [entry, { ...entry, id: "other" }], "2026-11-11"), null);
  assert.equal(resolveWhatsAppSchedule(null, [entry], "2026-11-12"), null);
});

test("linked periods retain times after deactivation or recurrence changes", () => {
  const inactive = { ...entry, is_active: false, repeat_days: [] };
  assert.equal(resolveWhatsAppSchedule(inactive, [], "2026-11-11")?.start_time, "14:00");
  assert.equal(resolveWhatsAppSchedule(inactive, [], "2026-11-18")?.end_time, "10:30");
});

test("period options include all matching periods sorted by their date-specific time", () => {
  const earlier = { ...entry, id: "earlier", start_time: "08:00", schedule_exceptions: [] };
  const options = getWhatsAppScheduleOptions([entry, earlier], "2026-11-11");
  assert.deepEqual(options.map((option) => [option.entry.id, option.start_time, option.end_time]), [
    ["earlier", "08:00", "10:30"], ["period", "14:00", "15:00"],
  ]);
  assert.deepEqual(getWhatsAppScheduleOptions([entry], "2026-11-12"), []);
});
