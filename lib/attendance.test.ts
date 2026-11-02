import assert from "node:assert/strict";
import test from "node:test";
import { countTotalAttendanceByStudent } from "./attendance";

test("late totals include nonconsecutive classes through the selected session", () => {
  const sessions = [
    { id: "later", records: [{ studentId: "a", status: "late" }] },
    { id: "current", records: [{ studentId: "a", status: "late" }] },
    { id: "previous", records: [{ studentId: "a", status: "late" }] },
    { id: "on-time", records: [{ studentId: "a", status: "present" }] },
    { id: "older", records: [{ studentId: "a", status: "late" }] },
  ];
  assert.equal(countTotalAttendanceByStudent(sessions, "current", ["a"], "late").get("a"), 3);
});

test("absences and missing records do not reset accumulated late totals", () => {
  for (const records of [[], [{ studentId: "a", status: "absent" }]]) {
    const sessions = [
      { id: "current", records: [{ studentId: "a", status: "late" }] },
      { id: "break", records },
      { id: "older", records: [{ studentId: "a", status: "late" }] },
    ];
    assert.equal(countTotalAttendanceByStudent(sessions, "current", ["a"], "late").get("a"), 2);
  }
});

test("absence totals remain separate per student across on-time and late attendance", () => {
  const sessions = [
    { id: "current", records: [{ studentId: "a", status: "absent" }, { studentId: "b", status: "absent" }] },
    { id: "previous", records: [{ studentId: "a", status: "absent" }, { studentId: "b", status: "late" }] },
    { id: "older", records: [{ studentId: "a", status: "present" }, { studentId: "b", status: "absent" }] },
  ];
  const counts = countTotalAttendanceByStudent(sessions, "current", ["a", "b"], "absent");
  assert.equal(counts.get("a"), 2);
  assert.equal(counts.get("b"), 2);
  assert.equal(countTotalAttendanceByStudent(sessions, "missing", ["a"], "absent").size, 0);
});
