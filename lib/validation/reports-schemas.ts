import { z } from "zod";
import { monthSchema, uuidSchema } from "./primitives";

export const reportSubjectQuerySchema = z.object({
  subject_id: uuidSchema.optional(),
});

export const reportMonthQuerySchema = z.object({
  month: monthSchema,
  subject_id: uuidSchema.optional(),
});

export const reportDiaryQuerySchema = z.object({
  month: monthSchema.optional(),
  subject_id: uuidSchema.optional(),
});
