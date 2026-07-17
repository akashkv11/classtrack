import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";

export const diaryStatusSchema = z.enum([
  "TAUGHT",
  "PARTIALLY_TAUGHT",
  "REVISION",
  "EXAM",
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
  timetable_entry_id: uuidSchema.optional().nullable(),
  syllabus_subject_id: uuidSchema.optional().nullable(),
  syllabus_chapter_id: uuidSchema.optional().nullable(),
  syllabus_topic_id: uuidSchema.optional().nullable(),
  syllabus_topic_ids: z.array(uuidSchema).optional().default([]),
  topic_taught: z.string().trim().min(3, "Topic taught is required"),
  subtopics_covered: z.array(z.string().trim().min(1)).optional().default([]),
  teaching_notes: z.string().trim().optional().nullable(),
  examples_covered: z.string().trim().optional().nullable(),
  student_response: studentResponseSchema.default("NOT_RECORDED"),
  next_class_plan: z.string().trim().optional().nullable(),
  diary_status: diaryStatusSchema,
  syllabus_status_update: syllabusStatusUpdateSchema.default("KEEP_CURRENT"),
  remarks: z.string().trim().optional().nullable(),
}).transform((data) => {
  const topicIds = [
    ...data.syllabus_topic_ids,
    ...(data.syllabus_topic_id ? [data.syllabus_topic_id] : []),
  ];
  const uniqueTopicIds = [...new Set(topicIds)];
  return {
    ...data,
    syllabus_topic_ids: uniqueTopicIds,
    syllabus_topic_id: uniqueTopicIds[0] ?? null,
  };
});

export const teachingDiaryUpdateSchema = z
  .object({
    entry_date: isoDateSchema.optional(),
    timetable_entry_id: uuidSchema.optional().nullable(),
    syllabus_subject_id: uuidSchema.optional().nullable(),
    syllabus_chapter_id: uuidSchema.optional().nullable(),
    syllabus_topic_id: uuidSchema.optional().nullable(),
    syllabus_topic_ids: z.array(uuidSchema).optional(),
    topic_taught: z.string().trim().min(3, "Topic taught is required").optional(),
    subtopics_covered: z.array(z.string().trim().min(1)).optional(),
    teaching_notes: z.string().trim().optional().nullable(),
    examples_covered: z.string().trim().optional().nullable(),
    student_response: studentResponseSchema.optional(),
    next_class_plan: z.string().trim().optional().nullable(),
    diary_status: diaryStatusSchema.optional(),
    syllabus_status_update: syllabusStatusUpdateSchema.optional(),
    remarks: z.string().trim().optional().nullable(),
  })
  .transform((data) => {
    if (data.syllabus_topic_ids === undefined && data.syllabus_topic_id === undefined) {
      return data;
    }
    const topicIds = [
      ...(data.syllabus_topic_ids ?? []),
      ...(data.syllabus_topic_id ? [data.syllabus_topic_id] : []),
    ];
    const uniqueTopicIds = [...new Set(topicIds)];
    return {
      ...data,
      syllabus_topic_ids: uniqueTopicIds,
      syllabus_topic_id: uniqueTopicIds[0] ?? null,
    };
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
