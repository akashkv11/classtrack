import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";
import { coerceNestedSubtopicLabels } from "@/lib/syllabus/normalize";

export const syllabusStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "REVISED",
  "SKIPPED",
]);

export const syllabusPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "IMPORTANT",
  "EXAM_IMPORTANT",
]);

export const subtopicSchema = z.object({
  subtopic_title: z.string().trim().min(1),
  nested_subtopics: z.array(z.string()).optional().default([]),
});

export const importSubtopicSchema = z
  .object({
    subtopic_title: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    nested_subtopics: z.unknown().optional(),
    nested: z.unknown().optional(),
  })
  .transform((data) => {
    const subtopicTitle = (data.subtopic_title ?? data.title ?? "").trim();
    return {
      subtopic_title: subtopicTitle,
      nested_subtopics: [
        ...coerceNestedSubtopicLabels(data.nested_subtopics),
        ...coerceNestedSubtopicLabels(data.nested),
      ],
    };
  })
  .refine((data) => data.subtopic_title.length > 0, {
    message: "Subtopic title is required",
  });

export const importTopicSchema = z
  .object({
    topic_title: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    subtopics: z.array(importSubtopicSchema).optional().default([]),
  })
  .transform((data) => ({
    topic_title: (data.topic_title ?? data.title ?? "").trim(),
    subtopics: data.subtopics,
  }))
  .refine((data) => data.topic_title.length > 0, {
    message: "Topic title is required",
  });

export const importChapterSchema = z.object({
  chapter_number: z.number().optional(),
  chapter_title: z.string().trim().min(1),
  chapter_summary: z.string().optional(),
  topics: z.array(importTopicSchema).optional().default([]),
});

export const basicInformationSchema = z
  .object({
    class_grade: z.string().optional(),
    stream: z.string().optional(),
    subject_name: z.string().optional(),
    subject: z.string().optional(),
    textbook_document_name: z.string().optional(),
    textbook_name: z.string().optional(),
    academic_year_version: z.string().optional(),
    board_curriculum: z.string().optional(),
    source_url: z.string().optional(),
    notes: z.string().optional(),
  })
  .transform((data) => ({
    class_grade: data.class_grade,
    stream: data.stream,
    subject_name: data.subject_name ?? data.subject,
    textbook_document_name: data.textbook_document_name ?? data.textbook_name,
    academic_year_version: data.academic_year_version,
    board_curriculum: data.board_curriculum,
    source_url: data.source_url,
    notes: data.notes,
  }))
  .optional();

export const appReadySyllabusSchema = z
  .object({
    class: z.string().optional(),
    stream: z.string().optional(),
    subject: z.string().optional(),
    chapters: z.array(importChapterSchema).optional().default([]),
  })
  .optional();

export const syllabusImportPayloadSchema = z.object({
  basic_information: basicInformationSchema,
  chapters: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  app_ready_syllabus: appReadySyllabusSchema,
  exhaustiveness_check: z
    .object({
      manual_review_required: z.array(z.string()).optional().default([]),
      potential_issues: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

export const syllabusImportPreviewSchema = z.object({
  json: syllabusImportPayloadSchema,
});

export const syllabusImportConfirmSchema = z.object({
  payload: syllabusImportPayloadSchema,
  options: z
    .object({
      importAsNewCopy: z.boolean().optional().default(false),
      importSubtopics: z.boolean().optional().default(true),
      setInitialStatus: syllabusStatusSchema.optional().default("NOT_STARTED"),
    })
    .optional(),
});

export const syllabusSubjectCreateSchema = z.object({
  subject_name: z.string().trim().min(1, "Subject name is required"),
  stream: z.string().trim().optional(),
  textbook_name: z.string().trim().optional(),
  board: z.string().trim().optional(),
  academic_year: z.string().trim().optional(),
});

export const syllabusSubjectUpdateSchema = z
  .object({
    subject_name: z.string().trim().min(1).optional(),
    stream: z.string().trim().nullable().optional(),
    textbook_name: z.string().trim().nullable().optional(),
    board: z.string().trim().nullable().optional(),
    academic_year: z.string().trim().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field is required",
  });

export const syllabusChapterCreateSchema = z.object({
  chapter_number: z.coerce.number().int().positive().optional(),
  chapter_title: z.string().trim().min(1, "Chapter title is required"),
  chapter_summary: z.string().trim().optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});

export const syllabusChapterUpdateSchema = z
  .object({
    chapter_number: z.coerce.number().int().positive().optional(),
    chapter_title: z.string().trim().min(1).optional(),
    chapter_summary: z.string().trim().nullable().optional(),
    display_order: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field is required",
  });

export const apiSubtopicSchema = z.object({
  subtopic_title: z.string().trim().min(1),
  nested_subtopics: z.array(z.string()).optional().default([]),
});

export const syllabusTopicCreateSchema = z.object({
  topic_title: z.string().trim().min(1, "Topic title is required"),
  subtopics: z.array(apiSubtopicSchema).optional().default([]),
  priority: syllabusPrioritySchema.optional().default("NORMAL"),
  estimated_classes: z.coerce.number().int().positive().nullable().optional(),
  target_date: isoDateSchema.nullable().optional(),
  remarks: z.string().trim().optional(),
});

export const syllabusTopicUpdateSchema = z
  .object({
    topic_title: z.string().trim().min(1).optional(),
    subtopics: z.array(apiSubtopicSchema).optional(),
    priority: syllabusPrioritySchema.optional(),
    estimated_classes: z.coerce.number().int().positive().nullable().optional(),
    target_date: isoDateSchema.nullable().optional(),
    remarks: z.string().trim().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field is required",
  });

export const syllabusTopicStatusSchema = z.object({
  status: syllabusStatusSchema,
});

export const syllabusClassIdQuerySchema = z.object({
  class_id: uuidSchema,
});

export type SyllabusImportPayload = z.infer<typeof syllabusImportPayloadSchema>;
