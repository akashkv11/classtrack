import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";

export const diaryStatusSchema = z.enum([
  "TAUGHT",
  "PARTIALLY_TAUGHT",
  "REVISION",
  "CANCELLED",
]);

export const studentResponseSchema = z.enum([
  "GOOD",
  "AVERAGE",
  "NEEDS_MORE_PRACTICE",
  "NOT_RECORDED",
]);

export const syllabusStatusUpdateSchema = z.enum([
  "KEEP_CURRENT",
  "IN_PROGRESS",
  "COMPLETED",
  "REVISED",
]);

export const teachingDiaryCreateSchema = z.object({
  entry_date: isoDateSchema,
  syllabus_subject_id: uuidSchema.optional().nullable(),
  syllabus_chapter_id: uuidSchema.optional().nullable(),
  syllabus_topic_id: uuidSchema.optional().nullable(),
  topic_taught: z.string().trim().min(3, "Topic taught is required"),
  teaching_notes: z.string().trim().optional().nullable(),
  examples_covered: z.string().trim().optional().nullable(),
  student_response: studentResponseSchema.default("NOT_RECORDED"),
  next_class_plan: z.string().trim().optional().nullable(),
  homework_given: z.boolean().default(false),
  homework_note: z.string().trim().optional().nullable(),
  diary_status: diaryStatusSchema,
  syllabus_status_update: syllabusStatusUpdateSchema.default("KEEP_CURRENT"),
  remarks: z.string().trim().optional().nullable(),
});

export const teachingDiaryUpdateSchema = teachingDiaryCreateSchema.partial().extend({
  topic_taught: z.string().trim().min(3, "Topic taught is required").optional(),
  diary_status: diaryStatusSchema.optional(),
});

export const teachingDiaryListQuerySchema = z.object({
  subject_id: uuidSchema.optional(),
  chapter_id: uuidSchema.optional(),
  topic_id: uuidSchema.optional(),
  date_from: isoDateSchema.optional(),
  date_to: isoDateSchema.optional(),
  status: diaryStatusSchema.optional(),
});

export const teachingDiaryClassIdQuerySchema = z.object({
  class_id: uuidSchema,
});
