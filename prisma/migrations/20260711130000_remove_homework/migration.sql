-- Drop homework module tables if they were created
DROP TABLE IF EXISTS "homework_assignments";
DROP TABLE IF EXISTS "homework_templates";
DROP TABLE IF EXISTS "homework_template_sets";

-- Remove homework fields from teaching diary
ALTER TABLE "teaching_diary_entries" DROP COLUMN IF EXISTS "homework_given";
ALTER TABLE "teaching_diary_entries" DROP COLUMN IF EXISTS "homework_note";
