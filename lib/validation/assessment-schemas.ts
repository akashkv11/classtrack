import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";

export const assessmentTypeSchema = z.enum([
  "CLASS_TEST",
  "UNIT_TEST",
  "MODEL_EXAM",
  "PRACTICAL",
  "REVISION_TEST",
  "ASSIGNMENT",
  "OTHER",
]);

export const assessmentCreateSchema = z.object({
  name: z.string().trim().min(2, "Assessment name is required"),
  syllabus_subject_id: uuidSchema,
  syllabus_chapter_id: uuidSchema.optional().nullable(),
  syllabus_topic_ids: z.array(uuidSchema).optional().default([]),
  assessment_type: assessmentTypeSchema,
  assessment_date: isoDateSchema,
  max_marks: z
    .number({ error: "Max marks is required" })
    .int("Max marks must be a whole number")
    .min(1, "Max marks must be at least 1")
    .max(1000, "Max marks is too large"),
  remarks: z.string().trim().optional().nullable(),
});

export const assessmentUpdateSchema = assessmentCreateSchema.partial().extend({
  name: z.string().trim().min(2, "Assessment name is required").optional(),
  syllabus_subject_id: uuidSchema.optional(),
  assessment_type: assessmentTypeSchema.optional(),
  assessment_date: isoDateSchema.optional(),
  max_marks: z
    .number()
    .int("Max marks must be a whole number")
    .min(1, "Max marks must be at least 1")
    .max(1000, "Max marks is too large")
    .optional(),
});

export const assessmentListQuerySchema = z.object({
  subject_id: uuidSchema.optional(),
  assessment_type: assessmentTypeSchema.optional(),
  date_from: isoDateSchema.optional(),
  date_to: isoDateSchema.optional(),
});

export const assessmentMarkRecordSchema = z.object({
  student_id: uuidSchema,
  marks_obtained: z
    .number()
    .int("Marks must be a whole number")
    .min(0, "Marks cannot be negative")
    .nullable(),
  remarks: z.string().trim().optional().nullable(),
});

export const assessmentMarksSaveSchema = z.object({
  records: z
    .array(assessmentMarkRecordSchema)
    .min(1, "At least one mark record is required"),
});

export const assessmentClassIdQuerySchema = z.object({
  class_id: uuidSchema,
});

export const studentHistoryQuerySchema = z.object({
  student_id: uuidSchema,
});
