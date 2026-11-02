import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";

export const preparationSlotSchema = z.object({
  date: isoDateSchema,
  timetable_entry_id: uuidSchema.nullable().optional(),
});

export const preparationSaveSchema = preparationSlotSchema.extend({
  records: z.array(z.object({
    student_id: uuidSchema,
    preparation_status: z.enum(["NOT_MARKED", "FULL", "PARTIAL", "NONE"]),
  })).max(1000).refine((records) => new Set(records.map((r) => r.student_id)).size === records.length,
    "Each student must appear only once"),
});
