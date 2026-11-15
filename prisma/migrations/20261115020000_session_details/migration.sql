ALTER TABLE attendance_sessions ADD COLUMN subject TEXT, ADD COLUMN start_time TEXT, ADD COLUMN end_time TEXT;
UPDATE attendance_sessions s SET subject = t.subject, start_time = t.start_time, end_time = t.end_time
FROM timetable_entries t WHERE s.timetable_entry_id = t.id;
ALTER TABLE attendance_sessions ADD CONSTRAINT session_time_order CHECK (
  (start_time IS NULL AND end_time IS NULL) OR
  (start_time IS NOT NULL AND end_time IS NOT NULL AND
   start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND
   end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND end_time > start_time)
);
DROP INDEX attendance_sessions_class_id_attendance_date_timetable_entry_id_key;
CREATE UNIQUE INDEX attendance_sessions_class_id_attendance_date_timetable_entry_id_key
ON attendance_sessions(class_id, attendance_date, timetable_entry_id);
-- Diary uniqueness is session-based; extra sessions may share a date and have no timetable slot.
DROP INDEX IF EXISTS teaching_diary_entries_class_date_slot_key;
