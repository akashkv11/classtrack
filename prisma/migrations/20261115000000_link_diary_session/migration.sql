-- Preserve historical diary entries by creating a session only where none exists.
ALTER TABLE "teaching_diary_entries" ADD COLUMN "session_id" UUID;
INSERT INTO "attendance_sessions" ("id", "class_id", "attendance_date", "timetable_entry_id", "updated_at")
SELECT gen_random_uuid(), slots.class_id, slots.entry_date, slots.timetable_entry_id, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT class_id, entry_date, timetable_entry_id FROM teaching_diary_entries) slots
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_sessions s WHERE s.class_id = slots.class_id
    AND s.attendance_date = slots.entry_date
    AND s.timetable_entry_id IS NOT DISTINCT FROM slots.timetable_entry_id
);
UPDATE teaching_diary_entries d SET session_id = s.id
FROM attendance_sessions s WHERE s.class_id = d.class_id
  AND s.attendance_date = d.entry_date
  AND s.timetable_entry_id IS NOT DISTINCT FROM d.timetable_entry_id;
ALTER TABLE "teaching_diary_entries" ALTER COLUMN "session_id" SET NOT NULL;
ALTER TABLE "teaching_diary_entries" ADD CONSTRAINT "teaching_diary_entries_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "teaching_diary_entries_session_id_idx" ON "teaching_diary_entries"("session_id");
