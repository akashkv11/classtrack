import { z } from "zod";
import { ALERT_STATUSES, ALERT_TYPES } from "@/lib/attendance-alerts/status";
import { monthSchema } from "@/lib/validation/primitives";

export const attendanceAlertClassIdQuerySchema = z.object({
  class_id: z.string().uuid("Invalid class ID"),
});

export const attendanceAlertsListQuerySchema = z.object({
  month: monthSchema,
  alert_type: z.enum(["ALL", ...ALERT_TYPES]).optional().default("ALL"),
  status: z.enum(["ALL", ...ALERT_STATUSES]).optional().default("OPEN"),
});

export const attendanceAlertStatusUpdateSchema = z.object({
  alert_key: z.string().min(1, "Alert key is required"),
  student_id: z.string().uuid("Invalid student ID"),
  alert_type: z.enum(ALERT_TYPES),
  month: monthSchema,
  status: z.enum(ALERT_STATUSES),
});
