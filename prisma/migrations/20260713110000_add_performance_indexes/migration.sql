-- CreateIndex
CREATE INDEX "classes_academic_year_id_idx" ON "classes"("academic_year_id");

-- CreateIndex
CREATE INDEX "syllabus_subjects_class_id_idx" ON "syllabus_subjects"("class_id");

-- CreateIndex
CREATE INDEX "syllabus_chapters_syllabus_subject_id_idx" ON "syllabus_chapters"("syllabus_subject_id");

-- CreateIndex
CREATE INDEX "syllabus_topics_syllabus_chapter_id_idx" ON "syllabus_topics"("syllabus_chapter_id");

-- CreateIndex
CREATE INDEX "syllabus_topics_syllabus_chapter_id_status_idx" ON "syllabus_topics"("syllabus_chapter_id", "status");

-- CreateIndex
CREATE INDEX "timetable_entries_class_id_idx" ON "timetable_entries"("class_id");

-- CreateIndex
CREATE INDEX "timetable_entries_class_id_entry_date_idx" ON "timetable_entries"("class_id", "entry_date");

-- CreateIndex
CREATE INDEX "students_class_id_idx" ON "students"("class_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_class_id_idx" ON "attendance_sessions"("class_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_class_id_attendance_date_idx" ON "attendance_sessions"("class_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_records_session_id_idx" ON "attendance_records"("session_id");

-- CreateIndex
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records"("student_id");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE INDEX "assessments_class_id_idx" ON "assessments"("class_id");

-- CreateIndex
CREATE INDEX "assessments_syllabus_subject_id_idx" ON "assessments"("syllabus_subject_id");

-- CreateIndex
CREATE INDEX "assessment_marks_assessment_id_idx" ON "assessment_marks"("assessment_id");

-- CreateIndex
CREATE INDEX "assessment_marks_student_id_idx" ON "assessment_marks"("student_id");

-- CreateIndex
CREATE INDEX "student_notes_class_id_idx" ON "student_notes"("class_id");

-- CreateIndex
CREATE INDEX "student_notes_class_id_status_idx" ON "student_notes"("class_id", "status");

-- CreateIndex
CREATE INDEX "parent_communications_class_id_idx" ON "parent_communications"("class_id");

-- CreateIndex
CREATE INDEX "parent_communications_class_id_status_idx" ON "parent_communications"("class_id", "status");

-- CreateIndex
CREATE INDEX "parent_communications_follow_up_date_idx" ON "parent_communications"("follow_up_date");

-- CreateIndex
CREATE INDEX "attendance_alert_statuses_class_id_idx" ON "attendance_alert_statuses"("class_id");

-- CreateIndex
CREATE INDEX "attendance_alert_statuses_class_id_status_idx" ON "attendance_alert_statuses"("class_id", "status");

-- CreateIndex
CREATE INDEX "attendance_alert_statuses_student_id_idx" ON "attendance_alert_statuses"("student_id");
