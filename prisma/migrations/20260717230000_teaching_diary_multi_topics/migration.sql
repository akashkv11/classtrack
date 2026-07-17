-- Allow a teaching diary entry to link multiple syllabus topics (same day / period).
CREATE TABLE "teaching_diary_topics" (
    "id" UUID NOT NULL,
    "teaching_diary_entry_id" UUID NOT NULL,
    "syllabus_topic_id" UUID NOT NULL,

    CONSTRAINT "teaching_diary_topics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teaching_diary_topics_teaching_diary_entry_id_syllabus_topic_id_key"
ON "teaching_diary_topics"("teaching_diary_entry_id", "syllabus_topic_id");

CREATE INDEX "teaching_diary_topics_syllabus_topic_id_idx"
ON "teaching_diary_topics"("syllabus_topic_id");

ALTER TABLE "teaching_diary_topics"
ADD CONSTRAINT "teaching_diary_topics_teaching_diary_entry_id_fkey"
FOREIGN KEY ("teaching_diary_entry_id") REFERENCES "teaching_diary_entries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teaching_diary_topics"
ADD CONSTRAINT "teaching_diary_topics_syllabus_topic_id_fkey"
FOREIGN KEY ("syllabus_topic_id") REFERENCES "syllabus_topics"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing single-topic links into the join table.
INSERT INTO "teaching_diary_topics" ("id", "teaching_diary_entry_id", "syllabus_topic_id")
SELECT gen_random_uuid(), "id", "syllabus_topic_id"
FROM "teaching_diary_entries"
WHERE "syllabus_topic_id" IS NOT NULL;
