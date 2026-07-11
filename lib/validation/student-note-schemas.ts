import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";

export const noteCategorySchema = z.enum([
  "ACADEMIC",
  "ATTENDANCE",
  "BEHAVIOUR",
  "IMPROVEMENT",
  "PARENT_FOLLOW_UP",
  "GENERAL",
]);

export const noteStatusSchema = z.enum(["OPEN", "CLOSED"]);

export const studentNoteCreateSchema = z
  .object({
    note_date: isoDateSchema,
    category: noteCategorySchema,
    note_text: z.string().trim().min(3, "Note is required"),
    follow_up_needed: z.boolean().default(false),
    follow_up_date: isoDateSchema.optional().nullable(),
    status: noteStatusSchema.default("OPEN"),
  })
  .refine(
    (data) => !data.follow_up_needed || data.follow_up_date,
    {
      message: "Follow-up date is required when follow-up is needed",
      path: ["follow_up_date"],
    },
  );

export const studentNoteUpdateSchema = z.object({
  note_date: isoDateSchema.optional(),
  category: noteCategorySchema.optional(),
  note_text: z.string().trim().min(3, "Note is required").optional(),
  follow_up_needed: z.boolean().optional(),
  follow_up_date: isoDateSchema.optional().nullable(),
  status: noteStatusSchema.optional(),
});

export const studentNoteClassIdQuerySchema = z.object({
  class_id: uuidSchema,
});
