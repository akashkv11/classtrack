import assert from "node:assert/strict";
import test from "node:test";
import { attendanceSaveSchema, attendanceDateQuerySchema } from "./schemas";
import { buildAttendanceLink, buildTeachingDiaryLink } from "../timetable/links";
const id = "10000000-0000-4000-8000-000000000001";
const base = { attendance_date: "2026-11-15", records: [{ student_id: id, status: "present" }] };

test("extra sessions require a subject and a valid increasing time range", () => {
  assert.equal(attendanceSaveSchema.safeParse(base).success, false);
  for (const [start_time, end_time] of [["09:00", "08:00"], ["09:00", "09:00"], ["25:00", "26:00"]]) {
    assert.equal(attendanceSaveSchema.safeParse({ ...base, subject: "Maths", start_time, end_time }).success, false);
  }
  assert.equal(attendanceSaveSchema.safeParse({ ...base, subject: "Maths", start_time: "09:00", end_time: "10:00" }).success, true);
});

test("existing sessions and timetable sessions do not require new details", () => {
  assert.equal(attendanceSaveSchema.safeParse({ ...base, session_id: id }).success, true);
  assert.equal(attendanceSaveSchema.safeParse({ ...base, timetable_entry_id: id }).success, true);
  assert.equal(attendanceDateQuerySchema.safeParse({ date: "2026-11-15", session_id: "invalid" }).success, false);
});

test("attendance and diary links preserve explicit session identity", () => {
  for (const link of [buildAttendanceLink("class", { sessionId: id }), buildTeachingDiaryLink("class", { sessionId: id })]) {
    assert.equal(new URL(link, "http://localhost").searchParams.get("session_id"), id);
  }
});
