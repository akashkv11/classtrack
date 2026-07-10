-- CreateTable
CREATE TABLE "teaching_diary_entries" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "syllabus_subject_id" UUID,
    "syllabus_chapter_id" UUID,
    "syllabus_topic_id" UUID,
    "entry_date" DATE NOT NULL,
    "topic_taught" TEXT NOT NULL,
    "teaching_notes" TEXT,
    "examples_covered" TEXT,
    "student_response" TEXT,
    "next_class_plan" TEXT,
    "diary_status" TEXT NOT NULL DEFAULT 'TAUGHT',
    "syllabus_status_update" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teaching_diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teaching_diary_entries_class_id_entry_date_idx" ON "teaching_diary_entries"("class_id", "entry_date");

-- CreateIndex
CREATE INDEX "teaching_diary_entries_syllabus_topic_id_idx" ON "teaching_diary_entries"("syllabus_topic_id");

-- AddForeignKey
ALTER TABLE "teaching_diary_entries" ADD CONSTRAINT "teaching_diary_entries_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_diary_entries" ADD CONSTRAINT "teaching_diary_entries_syllabus_subject_id_fkey" FOREIGN KEY ("syllabus_subject_id") REFERENCES "syllabus_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_diary_entries" ADD CONSTRAINT "teaching_diary_entries_syllabus_chapter_id_fkey" FOREIGN KEY ("syllabus_chapter_id") REFERENCES "syllabus_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_diary_entries" ADD CONSTRAINT "teaching_diary_entries_syllabus_topic_id_fkey" FOREIGN KEY ("syllabus_topic_id") REFERENCES "syllabus_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
