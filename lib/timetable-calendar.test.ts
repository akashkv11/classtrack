import assert from "node:assert/strict";
import test from "node:test";
import { getTimetableDay, getTimetableWeek, hideCompletedOneTimeEntries } from "./timetable-calendar";
import type { TimetableEntrySummary } from "./types/timetable";

const recurring: TimetableEntrySummary = {
  id: "recurring", class_id: "science", class_name: "Plus One Science", subject: "Computer Science",
  schedule_type: "repeating", entry_date: null, start_time: "09:30", end_time: "10:30",
  repeat_days: ["wednesday"], repeat_start: "2026-11-01", repeat_end: "2026-12-01",
  schedule_exceptions: [{ date: "2026-11-11", start_time: "14:00", end_time: "15:00" }],
  notes: null, is_active: true,
};

test("completed one-time classes are hidden at their end time, preserving recurring and upcoming classes", () => {
  const once = { ...recurring, schedule_type: "one_time" as const, entry_date: "2026-11-11", end_time: "12:00" };
  const entries = [
    { ...once, id: "past", entry_date: "2026-11-10" },
    { ...once, id: "finished", end_time: "11:00" },
    { ...once, id: "ending-now" },
    { ...once, id: "ongoing", end_time: "13:00" },
    { ...once, id: "future", entry_date: "2026-11-12" },
    recurring,
  ];
  assert.deepEqual(hideCompletedOneTimeEntries(entries, "2026-11-11", "12:00").map((entry) => entry.id), ["ongoing", "future", "recurring"]);
  assert.equal(entries.length, 6);
});

test("the timetable week starts on Monday, including Sunday and year boundaries", () => {
  assert.deepEqual(getTimetableWeek("2026-11-11"), ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
  assert.deepEqual(getTimetableWeek("2026-11-15"), getTimetableWeek("2026-11-11"));
  assert.equal(getTimetableWeek("2026-11-11", 1)[0], "2026-11-16");
  assert.equal(getTimetableWeek("2026-11-11", -1)[6], "2026-11-08");
  assert.deepEqual(getTimetableWeek("2027-01-01"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});

test("calendar periods use real dates and exception times when sorting", () => {
  const once: TimetableEntrySummary = { ...recurring, id: "once", schedule_type: "one_time", entry_date: "2026-11-11", start_time: "11:00", end_time: "12:00", schedule_exceptions: [] };
  const disabled = { ...recurring, id: "disabled", is_active: false };
  const anotherDate = { ...once, id: "tomorrow", entry_date: "2026-11-12" };
  const input = [recurring, once, disabled, anotherDate];
  const periods = getTimetableDay(input, "2026-11-11");
  assert.deepEqual(periods.map(({ entry }) => entry.id), ["once", "recurring"]);
  assert.equal(periods[1].start_time, "14:00");
  assert.equal(periods[1].end_time, "15:00");
  assert.equal(periods[1].is_exception, true);
  assert.deepEqual(input.map((entry) => entry.id), ["recurring", "once", "disabled", "tomorrow"]);
});

test("recurring schedules appear only on their weekday and within their date range", () => {
  assert.equal(getTimetableDay([recurring], "2026-11-12").length, 0);
  assert.equal(getTimetableDay([recurring], "2026-10-28").length, 0);
  assert.equal(getTimetableDay([recurring], "2026-12-02").length, 0);
  const regular = getTimetableDay([recurring], "2026-11-18");
  assert.equal(regular.length, 1);
  assert.equal(regular[0].start_time, "09:30");
  assert.equal(regular[0].is_exception, false);
});
