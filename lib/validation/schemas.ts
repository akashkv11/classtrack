import { z } from "zod";
import {
  isoDateSchema,
  monthSchema,
  normalizeOptionalPhone,
  normalizeWhatsAppNumber,
  optionalPhoneSchema,
  optionalWhatsAppSchema,
  uuidSchema,
} from "./primitives";

export const unlockSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const studentFormSchema = z.object({
  roll_no: z.coerce
    .number({ error: "Roll number is required" })
    .int("Roll number must be a whole number")
    .min(1, "Roll number must be at least 1"),
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or less"),
  admission_no: z
    .string()
    .trim()
    .max(50, "Admission number must be 50 characters or less"),
  parent_phone: optionalPhoneSchema,
  is_active: z.boolean(),
});

export const studentCreateSchema = z.object({
  roll_no: z.coerce
    .number({ error: "Roll number is required" })
    .int("Roll number must be a whole number")
    .min(1, "Roll number must be at least 1"),
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or less"),
  admission_no: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) =>
      typeof value === "string" && value.trim() ? value.trim() : null,
    )
    .pipe(
      z
        .string()
        .max(50, "Admission number must be 50 characters or less")
        .nullable(),
    ),
  parent_phone: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) =>
      typeof value === "string" ? normalizeOptionalPhone(value) : null,
    )
    .pipe(
      z
        .string()
        .regex(/^\d{10,15}$/, "Phone must be 10–15 digits")
        .nullable(),
    ),
  is_active: z.boolean().optional(),
});

export const studentUpdateSchema = z
  .object({
    roll_no: z.coerce
      .number()
      .int("Roll number must be a whole number")
      .min(1, "Roll number must be at least 1")
      .optional(),
    full_name: z
      .string()
      .trim()
      .min(1, "Full name cannot be empty")
      .max(100, "Full name must be 100 characters or less")
      .optional(),
    admission_no: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) =>
        typeof value === "string" && value.trim() ? value.trim() : null,
      )
      .pipe(
        z
          .string()
          .max(50, "Admission number must be 50 characters or less")
          .nullable(),
      )
      .optional(),
    parent_phone: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) =>
        typeof value === "string" ? normalizeOptionalPhone(value) : null,
      )
      .pipe(
        z
          .string()
          .regex(/^\d{10,15}$/, "Phone must be 10–15 digits")
          .nullable(),
      )
      .optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "At least one field is required" },
  );

export const academicYearSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Year name is required")
      .max(50, "Year name must be 50 characters or less"),
    start_date: isoDateSchema,
    end_date: isoDateSchema,
    set_active: z.boolean().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export const settingsFormSchema = z.object({
  active_academic_year_id: uuidSchema,
  message_signature: z
    .string()
    .trim()
    .max(200, "Signature must be 200 characters or less"),
  late_counts_as_present: z.boolean(),
});

export const settingsPatchSchema = z
  .object({
    active_academic_year_id: uuidSchema.optional(),
    message_signature: z
      .string()
      .trim()
      .max(200, "Signature must be 200 characters or less")
      .optional(),
    late_counts_as_present: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.active_academic_year_id !== undefined ||
      data.message_signature !== undefined ||
      data.late_counts_as_present !== undefined,
    { message: "At least one setting is required" },
  );

export const classSettingsFormSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or less"),
  whatsapp_number: optionalWhatsAppSchema,
  is_active: z.boolean(),
});

export const classSettingsPatchSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or less")
    .optional(),
  whatsapp_number: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) =>
      typeof value === "string" ? normalizeWhatsAppNumber(value) : null,
    )
    .pipe(
      z
        .string()
        .regex(/^\d{10,15}$/, "WhatsApp number must be 10–15 digits")
        .nullable(),
    )
    .optional(),
  is_active: z.boolean().optional(),
});

export const attendanceDateQuerySchema = z.object({
  date: isoDateSchema,
});

export const attendanceSaveSchema = z.object({
  attendance_date: isoDateSchema,
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  records: z
    .array(
      z.object({
        student_id: uuidSchema,
        status: z.enum(["present", "absent", "late"], {
          error: "Status must be present, absent, or late",
        }),
      }),
    )
    .min(1, "At least one attendance record is required"),
});

export const monthQuerySchema = z.object({
  class_id: uuidSchema,
  month: monthSchema,
});
