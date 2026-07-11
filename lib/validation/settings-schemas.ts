import { z } from "zod";
import { uuidSchema } from "./primitives";

const percentSchema = z.coerce
  .number()
  .int("Must be a whole number")
  .min(1, "Must be at least 1")
  .max(100, "Must be at most 100");

const positiveIntSchema = (max: number, label: string) =>
  z.coerce
    .number()
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} must be at most ${max}`);

export const attendanceThresholdsSchema = z.object({
  low_attendance_threshold: percentSchema,
  continuous_absence_threshold: positiveIntSchema(30, "Continuous absence threshold"),
  monthly_absence_threshold: positiveIntSchema(30, "Monthly absence threshold"),
  late_counts_as_present: z.boolean(),
});

export const assessmentThresholdsSchema = z.object({
  low_marks_threshold_percent: percentSchema,
});

export const reportSettingsSchema = z.object({
  teacher_name: z.string().trim().max(120, "Teacher name must be 120 characters or less"),
  institution_name: z
    .string()
    .trim()
    .max(160, "Institution name must be 160 characters or less"),
  report_title: z.string().trim().max(160, "Report title must be 160 characters or less"),
  message_signature: z
    .string()
    .trim()
    .max(200, "Signature must be 200 characters or less"),
  report_footer: z.string().trim().max(200, "Footer must be 200 characters or less"),
});

export const academicSettingsSchema = z.object({
  active_academic_year_id: uuidSchema,
});

export const settingsPatchSchema = z
  .object({
    active_academic_year_id: uuidSchema.optional(),
    low_attendance_threshold: percentSchema.optional(),
    continuous_absence_threshold: positiveIntSchema(30, "Continuous absence threshold").optional(),
    monthly_absence_threshold: positiveIntSchema(30, "Monthly absence threshold").optional(),
    late_counts_as_present: z.boolean().optional(),
    low_marks_threshold_percent: percentSchema.optional(),
    teacher_name: reportSettingsSchema.shape.teacher_name.optional(),
    institution_name: reportSettingsSchema.shape.institution_name.optional(),
    report_title: reportSettingsSchema.shape.report_title.optional(),
    message_signature: reportSettingsSchema.shape.message_signature.optional(),
    report_footer: reportSettingsSchema.shape.report_footer.optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "At least one setting is required" },
  );
