-- DropIndex
DROP INDEX "attendance_sessions_class_id_attendance_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_class_id_attendance_date_timetable_entry_id_key" ON "attendance_sessions"("class_id", "attendance_date", "timetable_entry_id");
