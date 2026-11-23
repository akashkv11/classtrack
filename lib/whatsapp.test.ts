import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClassUpdateMessage,
  buildSeparateClassUpdateMessage,
  buildWhatsAppUrl,
  setMessageHomework,
} from "./whatsapp";
import { settingsPatchSchema } from "./validation/settings-schemas";

const session = {
  className: "Plus Two Science",
  date: new Date("2026-11-02T00:00:00Z"),
};

test("homework answers replace the HW section without changing preparation", () => {
  const message = buildSeparateClassUpdateMessage({ ...session, unpreparedStudents: ["Rahul"] });
  const details = "Complete questions 1–5.\nBring $5 worth of supplies.";
  const withHomework = setMessageHomework(message, details);
  assert.ok(withHomework.includes(`*HW:* ${details}\n\n*UNPREPARED STUDENTS*`));
  assert.equal(withHomework.split("*UNPREPARED STUDENTS")[1], message.split("*UNPREPARED STUDENTS")[1]);
  const withoutHomework = setMessageHomework(withHomework, null);
  assert.ok(withoutHomework.includes("*HW:* No homework assigned.\n\n*UNPREPARED STUDENTS*"));
  assert.equal(withoutHomework.includes("Bring $5"), false);
});

test("separate update contains only class, date, homework and preparation", () => {
  const message = buildSeparateClassUpdateMessage({
    ...session,
    subject: "Computer Science",
    chapter: "3. Functions",
    topics: { title: "Functions", bullets: ["• Parameters", "• Return values"] },
    absentees: ["Absentee Name"], lateStudents: ["Late Name"],
    unpreparedStudents: ["Asha", "Rahul"],
    diaryStatus: "TAUGHT",
  });
  assert.equal(message, [
    "CLASS UPDATE", "", "*CLASS:* Plus Two Science", "*DATE:* 2 Nov 2026",
    "*HW:* No homework assigned.", "",
    "*UNPREPARED STUDENTS*", "1) Asha", "2) Rahul",
  ].join("\n"));
  const url = new URL(buildWhatsAppUrl("+91 98765 43210", message));
  assert.equal(url.pathname, "/919876543210");
  assert.equal(url.searchParams.get("text"), message);
});

test("preparation status lines are retained without diary or attendance details", () => {
  for (const diaryStatus of ["TAUGHT", "REVISION", "EXAM", "PARTIALLY_TAUGHT", "CANCELLED"]) {
    const message = buildSeparateClassUpdateMessage({ ...session, diaryStatus,
      topics: { title: "Functions; Arrays", bullets: ["• Parameters"] },
      attendanceRecorded: false, absentees: ["Asha"], lateStudents: ["Rahul"],
      preparationLines: ["1) Meera", "2) Dev (partially)"],
    });
    assert.doesNotMatch(message, /SUBJECT|SESSION|CHAPTER|TOPICS|ABSENTEES|LATE STUDENTS|Functions|Parameters|Attendance not recorded|Asha|Rahul/);
    assert.ok(message.endsWith("*UNPREPARED STUDENTS*\n1) Meera\n2) Dev (partially)"));
  }
});

test("no preparation selections says None without empty diary fields", () => {
  const message = buildSeparateClassUpdateMessage(session);
  assert.doesNotMatch(message, /SUBJECT|SESSION|CHAPTER|TOPICS|ABSENTEES|LATE STUDENTS|Diary not recorded/);
  assert.ok(message.endsWith("*UNPREPARED STUDENTS*\nNone"));
});

test("separate recipient accepts formatted numbers or clearing and rejects invalid numbers", () => {
  assert.ok(settingsPatchSchema.safeParse({ class_update_recipient: "+91 98765 43210" }).success);
  assert.ok(settingsPatchSchema.safeParse({ class_update_recipient: "" }).success);
  assert.equal(settingsPatchSchema.safeParse({ class_update_recipient: "123" }).success, false);
});

test("original attendance update still uses its original wording", () => {
  const message = buildClassUpdateMessage({ ...session, absentees: [] });
  assert.ok(message.startsWith("Class Update - Plus Two Science\n"));
  assert.ok(message.includes("No absentees today."));
  assert.ok(message.endsWith("Note: Absent students please copy notes. All students please revise today's topic before the next class."));
});
