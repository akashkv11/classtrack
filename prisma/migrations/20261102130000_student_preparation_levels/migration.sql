CREATE TABLE "student_preparations" (
  "id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "preparation_date" DATE NOT NULL,
  "timetable_entry_id" UUID,
  "status" TEXT NOT NULL CHECK ("status" IN ('FULL', 'PARTIAL', 'NONE', 'NOT_MARKED')),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_preparations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_preparations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_preparations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_preparations_timetable_entry_id_fkey" FOREIGN KEY ("timetable_entry_id") REFERENCES "timetable_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "student_preparation_slot_student_key"
ON "student_preparations"("class_id", "preparation_date", "timetable_entry_id", "student_id") NULLS NOT DISTINCT;
CREATE INDEX "student_preparations_class_id_student_id_preparation_date_idx"
ON "student_preparations"("class_id", "student_id", "preparation_date");

-- Preserve previous explicit unprepared marks without assuming other students were prepared.
INSERT INTO "student_preparations" ("id", "class_id", "student_id", "preparation_date", "timetable_entry_id", "status")
SELECT gen_random_uuid(), s."class_id", r."student_id", s."attendance_date", s."timetable_entry_id", 'NONE'
FROM "attendance_records" r JOIN "attendance_sessions" s ON s."id" = r."session_id"
WHERE r."is_unprepared" = true;
