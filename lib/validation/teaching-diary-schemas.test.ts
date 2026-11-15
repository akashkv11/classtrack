import assert from "node:assert/strict";
import test from "node:test";
import { teachingDiaryCreateSchema, teachingDiaryUpdateSchema } from "./teaching-diary-schemas";

const sessionId = "10000000-0000-4000-8000-000000000001";
const entry = { entry_date: "2026-11-15", topic_taught: "Fractions", diary_status: "TAUGHT" };

test("creating a diary requires exactly one valid session ID", () => {
  for (const session_id of [undefined, null, "", [], [sessionId], "invalid"]) {
    assert.equal(teachingDiaryCreateSchema.safeParse({ ...entry, session_id }).success, false);
  }
  assert.equal(teachingDiaryCreateSchema.safeParse({ ...entry, session_id: sessionId }).success, true);
});

test("updates can retain or replace the session but cannot clear it", () => {
  assert.equal(teachingDiaryUpdateSchema.safeParse({ teaching_notes: "Updated" }).success, true);
  assert.equal(teachingDiaryUpdateSchema.safeParse({ session_id: sessionId }).success, true);
  assert.equal(teachingDiaryUpdateSchema.safeParse({ session_id: null }).success, false);
});
