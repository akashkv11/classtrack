import { z } from "zod";
import {
  isoDateSchema,
  monthSchema,
  normalizeOptionalEmail,
  normalizeOptionalPhone,
  normalizeWhatsAppNumber,
  optionalEmailSchema,
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
  email: optionalEmailSchema,
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
  email: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) =>
      typeof value === "string" ? normalizeOptionalEmail(value) : null,
    )
    .pipe(
      z
        .email("Enter a valid email address")
        .max(254, "Email must be 254 characters or less")
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
    email: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) =>
        typeof value === "string" ? normalizeOptionalEmail(value) : null,
      )
      .pipe(
        z
          .email("Enter a valid email address")
          .max(254, "Email must be 254 characters or less")
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

const timeSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:MM)");

const repeatDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

const scheduleExceptionSchema = z.object({
  date: isoDateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
});

const timetableEntryFieldsSchema = z.object({
  class_id: uuidSchema,
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(100, "Subject must be 100 characters or less"),
  schedule_type: z.enum(["one_time", "repeating"], {
    error: "Schedule type must be one_time or repeating",
  }),
  entry_date: isoDateSchema.optional(),
  repeat_days: z.array(repeatDaySchema).optional(),
  schedule_exceptions: z.array(scheduleExceptionSchema).optional(),
  repeat_start: isoDateSchema.optional(),
  repeat_end: isoDateSchema.optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
});

function refineTimetableSchedule(
  data: z.infer<typeof timetableEntryFieldsSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.schedule_type === "one_time") {
    if (!data.start_time) {
      ctx.addIssue({
        code: "custom",
        message: "Start time is required",
        path: ["start_time"],
      });
    }
    if (!data.end_time) {
      ctx.addIssue({
        code: "custom",
        message: "End time is required",
        path: ["end_time"],
      });
    }
    if (data.start_time && data.end_time && data.end_time <= data.start_time) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["end_time"],
      });
    }
    if (!data.entry_date) {
      ctx.addIssue({
        code: "custom",
        message: "Date is required for a one-time entry",
        path: ["entry_date"],
      });
    }
    return;
  }

  if (!data.repeat_days?.length) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one repeat day",
      path: ["repeat_days"],
    });
  }
  if (!data.start_time) {
    ctx.addIssue({
      code: "custom",
      message: "Start time is required",
      path: ["start_time"],
    });
  }
  if (!data.end_time) {
    ctx.addIssue({
      code: "custom",
      message: "End time is required",
      path: ["end_time"],
    });
  }
  if (data.start_time && data.end_time && data.end_time <= data.start_time) {
    ctx.addIssue({
      code: "custom",
      message: "End time must be after start time",
      path: ["end_time"],
    });
  }

  const exceptions = data.schedule_exceptions ?? [];
  const seenDates = new Set<string>();
  exceptions.forEach((exception, index) => {
    if (exception.end_time <= exception.start_time) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["schedule_exceptions", index, "end_time"],
      });
    }
    if (seenDates.has(exception.date)) {
      ctx.addIssue({
        code: "custom",
        message: "Each one-time change needs a unique date",
        path: ["schedule_exceptions", index, "date"],
      });
    }
    seenDates.add(exception.date);

    if (data.repeat_start && exception.date < data.repeat_start) {
      ctx.addIssue({
        code: "custom",
        message: "One-time change must be within the repeat period",
        path: ["schedule_exceptions", index, "date"],
      });
    }
    if (data.repeat_end && exception.date > data.repeat_end) {
      ctx.addIssue({
        code: "custom",
        message: "One-time change must be within the repeat period",
        path: ["schedule_exceptions", index, "date"],
      });
    }
    if (data.repeat_days?.length) {
      const weekday = new Date(`${exception.date}T12:00:00`).getDay();
      const map = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      if (!data.repeat_days.includes(map[weekday] as (typeof data.repeat_days)[number])) {
        ctx.addIssue({
          code: "custom",
          message: "One-time change must fall on a regular repeat day",
          path: ["schedule_exceptions", index, "date"],
        });
      }
    }
  });

  if (!data.repeat_start) {
    ctx.addIssue({
      code: "custom",
      message: "Repeat start date is required",
      path: ["repeat_start"],
    });
  }
  if (!data.repeat_end) {
    ctx.addIssue({
      code: "custom",
      message: "Repeat end date is required",
      path: ["repeat_end"],
    });
  }
  if (data.repeat_start && data.repeat_end && data.repeat_end < data.repeat_start) {
    ctx.addIssue({
      code: "custom",
      message: "Repeat end date must be on or after start date",
      path: ["repeat_end"],
    });
  }
}

export const timetableEntryCreateSchema = timetableEntryFieldsSchema.superRefine(
  refineTimetableSchedule,
);

export const timetableEntryUpdateSchema = z
  .object({
    class_id: uuidSchema.optional(),
    subject: z
      .string()
      .trim()
      .min(1, "Subject is required")
      .max(100, "Subject must be 100 characters or less")
      .optional(),
    schedule_type: z.enum(["one_time", "repeating"]).optional(),
    entry_date: isoDateSchema.nullable().optional(),
    repeat_days: z.array(repeatDaySchema).optional(),
    schedule_exceptions: z.array(scheduleExceptionSchema).optional(),
    repeat_start: isoDateSchema.nullable().optional(),
    repeat_end: isoDateSchema.nullable().optional(),
    start_time: timeSchema.optional(),
    end_time: timeSchema.optional(),
    notes: z.string().max(500, "Notes must be 500 characters or less").nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required",
  });
