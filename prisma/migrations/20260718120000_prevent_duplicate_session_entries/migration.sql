-- Enforce one attendance session per class/date even when timetable_entry_id is NULL
-- (Postgres treats NULLs as distinct in unique indexes unless NULLS NOT DISTINCT).
DROP INDEX IF EXISTS "attendance_sessions_class_id_attendance_date_timetable_entry_id_key";

-- Prefer the oldest session when cleaning null-slot duplicates.
DELETE FROM "attendance_sessions" a
USING "attendance_sessions" b
WHERE a."timetable_entry_id" IS NULL
  AND b."timetable_entry_id" IS NULL
  AND a."class_id" = b."class_id"
  AND a."attendance_date" = b."attendance_date"
  AND a."created_at" > b."created_at";

CREATE UNIQUE INDEX "attendance_sessions_class_id_attendance_date_timetable_entry_id_key"
  ON "attendance_sessions"("class_id", "attendance_date", "timetable_entry_id")
  NULLS NOT DISTINCT;

-- One teaching diary entry per class slot per date.
DELETE FROM "teaching_diary_entries" a
USING "teaching_diary_entries" b
WHERE a."timetable_entry_id" IS NOT NULL
  AND b."timetable_entry_id" IS NOT NULL
  AND a."timetable_entry_id" = b."timetable_entry_id"
  AND a."class_id" = b."class_id"
  AND a."entry_date" = b."entry_date"
  AND a."created_at" > b."created_at";

CREATE UNIQUE INDEX "teaching_diary_entries_class_date_slot_key"
  ON "teaching_diary_entries"("class_id", "entry_date", "timetable_entry_id")
  WHERE "timetable_entry_id" IS NOT NULL;
