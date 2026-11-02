import assert from "node:assert/strict";
import test from "node:test";
import { preparationStreak, preparationMessageLines } from "./preparation";
import { preparationSaveSchema } from "./validation/preparation-schemas";

test("streak counts consecutive failures and stops at full, partial, or unknown preparation", () => {
  assert.equal(preparationStreak(["NONE", "NONE", "NONE", "FULL", "NONE"]), 3);
  assert.equal(preparationStreak(["NONE", "PARTIAL", "NONE"]), 1);
  assert.equal(preparationStreak(["NONE", "NOT_MARKED", "NONE"]), 1);
  assert.equal(preparationStreak(["FULL", "NONE"]), 0);
  assert.equal(preparationStreak([]), 0);
});

test("optional rule counts partially prepared students but unknown entries still break the streak", () => {
  assert.equal(preparationStreak(["NONE", "PARTIAL", "NONE", "FULL"], true), 3);
  assert.equal(preparationStreak(["PARTIAL", "NOT_MARKED", "NONE"], true), 1);
});

test("WhatsApp distinguishes partial and no preparation and does not imply unknown students prepared", () => {
  assert.deepEqual(preparationMessageLines([
    { full_name: "Asha", preparation_status: "FULL", previous_streak: 2 },
    { full_name: "Rahul", preparation_status: "PARTIAL", previous_streak: 2 },
    { full_name: "Dev", preparation_status: "NONE", previous_streak: 2 },
    { full_name: "Meera", preparation_status: "NOT_MARKED", previous_streak: 0 },
  ]), ["1) Rahul (partially prepared)", "2) Dev (not prepared; 3 consecutive unprepared classes)", "Preparation not marked for 1 student."]);
  assert.deepEqual(preparationMessageLines([{ full_name: "Asha", preparation_status: "FULL", previous_streak: 0 }]), ["None"]);
});

test("message counts include the current session once and respect the partial-preparation rule", () => {
  assert.deepEqual(preparationMessageLines([
    { full_name: "Dev", preparation_status: "NONE", previous_streak: 0 },
    { full_name: "Meera", preparation_status: "NONE", previous_streak: 3 },
  ]), [
    "1) Dev (not prepared; 1 consecutive unprepared class)",
    "2) Meera (not prepared; 4 consecutive unprepared classes)",
  ]);
  assert.deepEqual(preparationMessageLines([
    { full_name: "Rahul", preparation_status: "PARTIAL", previous_streak: 2 },
  ], true), ["1) Rahul (partially prepared; 3 consecutive unprepared classes)"]);
});

test("preparation validation rejects duplicate students, invalid dates, and unknown statuses", () => {
  const record = { student_id: "00000000-0000-4000-8000-000000000001", preparation_status: "PARTIAL" };
  assert.ok(preparationSaveSchema.safeParse({ date: "2026-11-02", records: [record] }).success);
  assert.equal(preparationSaveSchema.safeParse({ date: "2026-11-02", records: [record, record] }).success, false);
  assert.equal(preparationSaveSchema.safeParse({ date: "2026-02-30", records: [record] }).success, false);
  assert.equal(preparationSaveSchema.safeParse({ date: "2026-11-02", records: [{ ...record, preparation_status: "INVALID" }] }).success, false);
});
