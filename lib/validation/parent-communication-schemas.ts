import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./primitives";

export const communicationTypeSchema = z.enum([
  "WHATSAPP",
  "PHONE_CALL",
  "IN_PERSON",
  "SMS",
  "OTHER",
]);

export const communicationReasonSchema = z.enum([
  "ATTENDANCE",
  "LOW_MARKS",
  "BEHAVIOUR",
  "HOMEWORK",
  "IMPROVEMENT",
  "GENERAL",
]);

export const communicationStatusSchema = z.enum([
  "OPEN",
  "COMPLETED",
  "NO_RESPONSE",
  "FOLLOW_UP_NEEDED",
]);

export const parentCommunicationCreateSchema = z
  .object({
    communication_date: isoDateSchema,
    communication_type: communicationTypeSchema,
    reason: communicationReasonSchema,
    summary: z.string().trim().min(3, "Summary is required"),
    student_note_id: uuidSchema.optional().nullable(),
    follow_up_needed: z.boolean().default(false),
    follow_up_date: isoDateSchema.optional().nullable(),
    status: communicationStatusSchema.default("OPEN"),
  })
  .refine((data) => !data.follow_up_needed || data.follow_up_date, {
    message: "Follow-up date is required when follow-up is needed",
    path: ["follow_up_date"],
  });

export const parentCommunicationUpdateSchema = z.object({
  communication_date: isoDateSchema.optional(),
  communication_type: communicationTypeSchema.optional(),
  reason: communicationReasonSchema.optional(),
  summary: z.string().trim().min(3, "Summary is required").optional(),
  student_note_id: uuidSchema.optional().nullable(),
  follow_up_needed: z.boolean().optional(),
  follow_up_date: isoDateSchema.optional().nullable(),
  status: communicationStatusSchema.optional(),
});

export const parentCommunicationClassIdQuerySchema = z.object({
  class_id: uuidSchema,
});
