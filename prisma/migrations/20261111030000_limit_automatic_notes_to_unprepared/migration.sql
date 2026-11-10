-- Only Not prepared marks should have automatic concern notes.
-- Teacher-written notes in the separate note field are retained.
UPDATE "student_preparations"
SET "automatic_note" = NULL
WHERE "status" <> 'NONE' AND "automatic_note" IS NOT NULL;
