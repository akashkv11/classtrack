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

test("homework answers replace the HW section without changing attendance or preparation", () => {
  const message = buildSeparateClassUpdateMessage({ ...session, absentees: ["Asha"], lateStudents: ["Dev"], unpreparedStudents: ["Rahul"] });
  const details = "Complete questions 1–5.\nBring $5 worth of supplies.";
  const withHomework = setMessageHomework(message, details);
  assert.ok(withHomework.includes(`*HW:* ${details}\n\n*ABSENTEES*`));
  assert.equal(withHomework.split("*ABSENTEES*")[1], message.split("*ABSENTEES*")[1]);
  const withoutHomework = setMessageHomework(withHomework, null);
  assert.ok(withoutHomework.includes("*HW:* No homework assigned.\n\n*ABSENTEES*"));
  assert.equal(withoutHomework.includes("Bring $5"), false);
});

test("message includes individual total absence and late counts", () => {
  const message = buildSeparateClassUpdateMessage({ ...session,
    absentees: [{ fullName: "Asha", totalCount: 3 }, { fullName: "Dev", totalCount: 1 }],
    lateStudents: [{ fullName: "Meera", totalCount: 2 }],
  });
  assert.ok(message.includes("*ABSENTEES*\n1) Asha (3 class absent)\n2) Dev (1 class absent)"));
  assert.ok(message.includes("*LATE STUDENTS*\n1) Meera (2 class late)"));
  const withHomework = setMessageHomework(message, "Revise the chapter.");
  assert.equal(withHomework.split("*ABSENTEES*")[1], message.split("*ABSENTEES*")[1]);
});

test("separate update includes diary details and a numbered unprepared list", () => {
  const message = buildSeparateClassUpdateMessage({
    ...session,
    subject: "Computer Science",
    chapter: "3. Functions",
    topics: { title: "Functions", bullets: ["• Parameters", "• Return values"] },
    unpreparedStudents: ["Asha", "Rahul"],
    diaryStatus: "TAUGHT",
  });
  assert.equal(message, [
    "CLASS UPDATE", "", "*CLASS:* Plus Two Science", "*DATE:* 2 Nov 2026",
    "*SUBJECT:* Computer Science", "*SESSION:* Regular class", "*CHAPTER:* 3. Functions", "*TOPICS:* Functions",
    "*HW:*", "", "",
    "*ABSENTEES*", "None", "", "*LATE STUDENTS*", "None", "",
    "*UNPREPARED STUDENTS*", "1) Asha", "2) Rahul",
  ].join("\n"));
  const url = new URL(buildWhatsAppUrl("+91 98765 43210", message));
  assert.equal(url.pathname, "/919876543210");
  assert.equal(url.searchParams.get("text"), message);
});

test("separate update includes attendance lists before preparation so preview edits retain them", () => {
  const message = buildSeparateClassUpdateMessage({
    ...session,
    absentees: ["Asha", "Dev"],
    lateStudents: ["Rahul"],
    preparationLines: ["1) Meera (not prepared; 3 consecutive unprepared classes)"],
  });
  assert.ok(message.includes("*ABSENTEES*\n1) Asha\n2) Dev\n\n*LATE STUDENTS*\n1) Rahul"));
  const retained = message.split("*UNPREPARED STUDENTS*")[0];
  assert.ok(retained.includes("*ABSENTEES*\n1) Asha\n2) Dev"));
  assert.ok(retained.includes("*LATE STUDENTS*\n1) Rahul"));
  assert.ok(message.endsWith("*UNPREPARED STUDENTS*\n1) Meera (not prepared; 3 consecutive unprepared classes)"));
});

test("missing diary data leaves fields editable and no selection says None", () => {
  const message = buildSeparateClassUpdateMessage(session);
  assert.ok(message.includes("*SUBJECT:*\n*SESSION:* Not recorded in teaching diary\n*CHAPTER:*\n*TOPICS:*\n*HW:*"));
  assert.ok(message.endsWith("*UNPREPARED STUDENTS*\nNone"));
});

test("session updates show the diary activity and main topics without subtopics", () => {
  for (const [diaryStatus, label] of [["REVISION", "Revision"], ["EXAM", "Exam"], ["PARTIALLY_TAUGHT", "Partially taught"]]) {
    const message = buildSeparateClassUpdateMessage({ ...session, diaryStatus,
      topics: { title: "Functions; Arrays", bullets: ["• Parameters", "• Return values"] },
    });
    assert.ok(message.includes(`*SESSION:* ${label}`));
    assert.ok(message.includes("*TOPICS:* Functions; Arrays"));
    assert.equal(message.includes("Parameters"), false);
    assert.equal(message.includes("Return values"), false);
  }
  const cancelled = buildSeparateClassUpdateMessage({ ...session, diaryStatus: "CANCELLED", topics: { title: "Functions", bullets: [] } });
  assert.ok(cancelled.includes("*SESSION:* Cancelled"));
  assert.ok(cancelled.includes("*TOPICS:* No topics covered (class cancelled)."));
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
