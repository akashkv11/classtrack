import assert from "node:assert/strict";
import test from "node:test";
import { preparationStreak, preparationMessageLines, buildAutomaticPreparationNote } from "./preparation";
import { preparationSaveSchema } from "./validation/preparation-schemas";

test("streak counts consecutive failures and stops at full, partial, or unknown preparation", () => {
  assert.equal(preparationStreak(["NONE", "NONE", "NONE", "FULL", "NONE"]), 3);
  assert.equal(preparationStreak(["NONE", "PARTIAL", "NONE"]), 1);
  assert.equal(preparationStreak(["NONE", "NOT_MARKED", "NONE"]), 1);
  assert.equal(preparationStreak(["FULL", "NONE"]), 0);
  assert.equal(preparationStreak([]), 0);
});

test("automatic notes cover both not prepared and partially prepared students", () => {
  assert.equal(buildAutomaticPreparationNote("NONE", "2026-11-11", "Computer Science"), "Not prepared for Computer Science on 11-11-2026.");
  assert.equal(buildAutomaticPreparationNote("PARTIAL", "2026-11-11"), "Partially prepared for class on 11-11-2026.");
  assert.equal(buildAutomaticPreparationNote("FULL", "2026-11-11", "Computer Science"), null);
  assert.equal(buildAutomaticPreparationNote("NOT_MARKED", "2026-11-11"), null);
});

test("optional rule counts partially prepared students but unknown entries still break the streak", () => {
  assert.equal(preparationStreak(["NONE", "PARTIAL", "NONE", "FULL"], true), 3);
  assert.equal(preparationStreak(["PARTIAL", "NOT_MARKED", "NONE"], true), 1);
});

test("WhatsApp distinguishes partial and no preparation and does not imply unknown students prepared", () => {
  assert.deepEqual(preparationMessageLines([
    { full_name: "Asha", preparation_status: "FULL" },
    { full_name: "Rahul", preparation_status: "PARTIAL" },
    { full_name: "Dev", preparation_status: "NONE" },
    { full_name: "Meera", preparation_status: "NOT_MARKED" },
  ]), ["1) Rahul (partially prepared)", "2) Dev (not prepared)", "Preparation not marked for 1 student."]);
  assert.deepEqual(preparationMessageLines([{ full_name: "Asha", preparation_status: "FULL" }]), ["None"]);
});

test("message omits preparation counts even for students with a recorded streak", () => {
  const students = [
    { full_name: "Dev", preparation_status: "NONE" as const, previous_streak: 0 },
    { full_name: "Meera", preparation_status: "NONE" as const, previous_streak: 3, note: "Private follow-up note" },
    { full_name: "Rahul", preparation_status: "PARTIAL" as const, previous_streak: 2 },
  ];
  assert.deepEqual(preparationMessageLines(students), [
    "1) Dev (not prepared)",
    "2) Meera (not prepared)",
    "3) Rahul (partially prepared)",
  ]);
});

test("preparation validation rejects duplicate students, invalid dates, and unknown statuses", () => {
  const record = { student_id: "00000000-0000-4000-8000-000000000001", preparation_status: "PARTIAL" };
  assert.ok(preparationSaveSchema.safeParse({ date: "2026-11-02", records: [record] }).success);
  assert.equal(preparationSaveSchema.safeParse({ date: "2026-11-02", records: [record, record] }).success, false);
  assert.equal(preparationSaveSchema.safeParse({ date: "2026-02-30", records: [record] }).success, false);
  assert.equal(preparationSaveSchema.safeParse({ date: "2026-11-02", records: [{ ...record, preparation_status: "INVALID" }] }).success, false);
});
