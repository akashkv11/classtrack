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

export const reportAssessmentsQuerySchema = z.object({
  month: monthSchema.optional(),
});

export const reportStudentProfileQuerySchema = z.object({
  student_id: uuidSchema.optional(),
  all_students: z.literal("true").optional(),
}).refine(data => Boolean(data.student_id) !== Boolean(data.all_students), {
  message: "Select exactly one student or all students", path: ["student_id"],
});
