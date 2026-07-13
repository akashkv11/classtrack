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

const decimalMarkSchema = (label: string) =>
  z
    .number({ error: `${label} is required` })
    .min(0, `${label} cannot be negative`)
    .refine(
      (value) => Math.round(value * 100) === value * 100,
      `${label} can have at most 2 decimal places`,
    );

const maxMarksSchema = decimalMarkSchema("Max marks")
  .refine((value) => value >= 0.01, "Max marks must be at least 0.01")
  .refine((value) => value <= 1000, "Max marks is too large");

export const assessmentCreateSchema = z.object({
  name: z.string().trim().min(2, "Assessment name is required"),
  syllabus_subject_id: uuidSchema,
  syllabus_chapter_id: uuidSchema.optional().nullable(),
  syllabus_topic_ids: z.array(uuidSchema).optional().default([]),
  assessment_type: assessmentTypeSchema,
  assessment_date: isoDateSchema,
  max_marks: maxMarksSchema,
  remarks: z.string().trim().optional().nullable(),
});

export const assessmentUpdateSchema = assessmentCreateSchema.partial().extend({
  name: z.string().trim().min(2, "Assessment name is required").optional(),
  syllabus_subject_id: uuidSchema.optional(),
  assessment_type: assessmentTypeSchema.optional(),
  assessment_date: isoDateSchema.optional(),
  max_marks: maxMarksSchema.optional(),
});

export const assessmentListQuerySchema = z.object({
  subject_id: uuidSchema.optional(),
  assessment_type: assessmentTypeSchema.optional(),
  date_from: isoDateSchema.optional(),
  date_to: isoDateSchema.optional(),
});

export const assessmentMarkRecordSchema = z.object({
  student_id: uuidSchema,
  marks_obtained: decimalMarkSchema("Marks")
    .nullable()
    .refine((value) => value === null || value >= 0, "Marks cannot be negative"),
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
