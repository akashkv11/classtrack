-- Optional links from attendance sessions and teaching diary entries to timetable periods.

ALTER TABLE "attendance_sessions"
ADD COLUMN "timetable_entry_id" UUID;

ALTER TABLE "teaching_diary_entries"
ADD COLUMN "timetable_entry_id" UUID;

ALTER TABLE "attendance_sessions"
ADD CONSTRAINT "attendance_sessions_timetable_entry_id_fkey"
FOREIGN KEY ("timetable_entry_id") REFERENCES "timetable_entries"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teaching_diary_entries"
ADD CONSTRAINT "teaching_diary_entries_timetable_entry_id_fkey"
FOREIGN KEY ("timetable_entry_id") REFERENCES "timetable_entries"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "attendance_sessions_timetable_entry_id_idx"
ON "attendance_sessions"("timetable_entry_id");

CREATE INDEX "teaching_diary_entries_timetable_entry_id_idx"
ON "teaching_diary_entries"("timetable_entry_id");
