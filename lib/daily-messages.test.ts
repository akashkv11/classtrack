import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyClassMessage, buildDailySeparateMessage, type DailyMessageDetails, type DailySession } from "./daily-messages";
const session = (overrides: Partial<DailySession> = {}): DailySession => ({ id: "one", subject: "Maths", start_time: "09:00", end_time: "10:00", diary_status: "TAUGHT", chapter: "Fractions", topics: { title: "Addition", bullets: ["• Examples"] }, attendance_recorded: true, absentees: [], late_students: [], ...overrides });
const details = (...sessions: DailySession[]): DailyMessageDetails => ({ class_name: "10 A", date: "2026-11-15", channel_url: "https://example.com/materials", sessions });
test("one-session format retains monthly absence count; exams only show chapter", () => {
  const message = buildDailyClassMessage(details(session({ diary_status: "EXAM", absentees: [{ id: "a", name: "Arun", monthly_absent_count: 3 }] })));
  assert.match(message, /^Exam Update - 10 A/);
  assert.match(message, /Arun \(3 class absent\)/);
  assert.match(message, /Chapter:\nFractions/);
  assert.doesNotMatch(message, /Addition|Examples|SESSION 1/);
});
test("mixed daily class message separates attendance, hides exam topics and late students, and includes materials once", () => {
  const message = buildDailyClassMessage(details(session({ diary_status: "EXAM", late_students: [{ id: "x", name: "LateName" }] }), session({ id: "two", subject: "Science", chapter: "Electricity", topics: { title: "Current", bullets: [] }, absentees: [{ id: "a", name: "Arun" }] })));
  assert.match(message, /DAILY CLASS UPDATE/); assert.match(message, /SESSION 2 — Science/);
  assert.doesNotMatch(message, /Addition|LateName/); assert.match(message, /Chapter: Fractions/);
  assert.match(message, /No absentees/); assert.match(message, /1\. Arun/);
  assert.equal(message.split("https://example.com/materials").length, 2);
});
test("cancelled and missing attendance sessions never imply all present", () => {
  const message = buildDailyClassMessage(details(session({ diary_status: "CANCELLED", absentees: [{ id: "a", name: "Arun" }] }), session({ id: "two", diary_status: null, attendance_recorded: false })));
  assert.match(message, /Class cancelled/); assert.match(message, /Diary not recorded/); assert.match(message, /Attendance not recorded/);
  assert.doesNotMatch(message, /Arun|No absentees/);
});
test("separate daily updates use the same minimal template for one or multiple sessions", () => {
  const people = [{ id: "a", name: "Arun" }, { id: "b", name: "Arun" }];
  const first = session({ absentees: people, diary_status: "EXAM" });
  const second = session({ id: "two", start_time: "14:00", end_time: "15:00", late_students: [{ id: "c", name: "Late Name" }] });
  const preparation = ["1) Meera", "2) Dev (partially)"];
  const one = buildDailySeparateMessage(details(first), preparation, "Complete exercises 1–5.");
  const multiple = buildDailySeparateMessage(details(first, second), preparation, "Complete exercises 1–5.");
  assert.equal(multiple, one);
  assert.equal(multiple, ["CLASS UPDATE", "", "*CLASS:* 10 A", "*DATE:* 15 Nov 2026", "*HW:* Complete exercises 1–5.", "", "*UNPREPARED STUDENTS*", ...preparation].join("\n"));
  assert.doesNotMatch(multiple, /SUBJECT|SESSION|CHAPTER|TOPICS|EXAM|CLASSWORK|ABSENTEES|LATE STUDENTS|Arun|Late Name|Maths|Fractions|Addition/);
  assert.match(buildDailySeparateMessage(details(first, second), ["None"], null), /No homework assigned/);
});

test("minimal daily update reports missing preparation without attendance details", () => {
  for (const day of [details(), details(session()), details(session({ attendance_recorded: false }), session({ id: "two", subject: "Science" }))]) {
    const message = buildDailySeparateMessage(day, []);
    assert.match(message, /Preparation not recorded/);
    assert.doesNotMatch(message, /Attendance|SUBJECT|SESSION|CHAPTER|TOPICS|ABSENTEES|LATE STUDENTS/);
  }
});
