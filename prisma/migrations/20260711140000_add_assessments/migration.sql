-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "syllabus_subject_id" UUID NOT NULL,
    "syllabus_chapter_id" UUID,
    "name" TEXT NOT NULL,
    "assessment_type" TEXT NOT NULL,
    "assessment_date" DATE NOT NULL,
    "max_marks" INTEGER NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_topics" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "syllabus_topic_id" UUID NOT NULL,

    CONSTRAINT "assessment_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_marks" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "marks_obtained" INTEGER,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assessment_marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessments_class_id_assessment_date_idx" ON "assessments"("class_id", "assessment_date");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_topics_assessment_id_syllabus_topic_id_key" ON "assessment_topics"("assessment_id", "syllabus_topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_marks_assessment_id_student_id_key" ON "assessment_marks"("assessment_id", "student_id");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_syllabus_subject_id_fkey" FOREIGN KEY ("syllabus_subject_id") REFERENCES "syllabus_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_syllabus_chapter_id_fkey" FOREIGN KEY ("syllabus_chapter_id") REFERENCES "syllabus_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_topics" ADD CONSTRAINT "assessment_topics_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_topics" ADD CONSTRAINT "assessment_topics_syllabus_topic_id_fkey" FOREIGN KEY ("syllabus_topic_id") REFERENCES "syllabus_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
