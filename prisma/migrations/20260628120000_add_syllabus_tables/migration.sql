-- CreateTable
CREATE TABLE "syllabus_subjects" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "subject_name" TEXT NOT NULL,
    "source_name" TEXT,
    "source_url" TEXT,
    "textbook_name" TEXT,
    "board" TEXT,
    "academic_year" TEXT,
    "stream" TEXT,
    "import_meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "syllabus_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_chapters" (
    "id" UUID NOT NULL,
    "syllabus_subject_id" UUID NOT NULL,
    "chapter_number" INTEGER,
    "chapter_title" TEXT NOT NULL,
    "chapter_summary" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "syllabus_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_topics" (
    "id" UUID NOT NULL,
    "syllabus_chapter_id" UUID NOT NULL,
    "topic_title" TEXT NOT NULL,
    "topic_description" TEXT,
    "subtopics" JSONB,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimated_classes" INTEGER,
    "target_date" DATE,
    "started_at" DATE,
    "completed_at" DATE,
    "revised_at" DATE,
    "remarks" TEXT,
    "needs_manual_review" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "syllabus_topics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "syllabus_subjects" ADD CONSTRAINT "syllabus_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_chapters" ADD CONSTRAINT "syllabus_chapters_syllabus_subject_id_fkey" FOREIGN KEY ("syllabus_subject_id") REFERENCES "syllabus_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_topics" ADD CONSTRAINT "syllabus_topics_syllabus_chapter_id_fkey" FOREIGN KEY ("syllabus_chapter_id") REFERENCES "syllabus_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
