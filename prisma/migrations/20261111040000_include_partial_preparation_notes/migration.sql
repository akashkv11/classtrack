-- Fill missing automatic notes for both preparation concern levels.
UPDATE "student_preparations" p
SET "automatic_note" =
  CASE p."status" WHEN 'NONE' THEN 'Not prepared' ELSE 'Partially prepared' END
  || ' for ' || COALESCE((SELECT t."subject" FROM "timetable_entries" t WHERE t."id" = p."timetable_entry_id"), 'class')
  || ' on ' || to_char(p."preparation_date", 'DD-MM-YYYY') || '.'
WHERE p."status" IN ('NONE', 'PARTIAL') AND p."automatic_note" IS NULL;
