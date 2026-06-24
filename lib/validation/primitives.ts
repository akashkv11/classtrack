import { z } from "zod";

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD)")
  .refine(isValidISODate, "Enter a valid date");

export const monthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, "Enter a valid month (YYYY-MM)")
  .refine((value) => {
    const month = Number(value.split("-")[1]);
    return month >= 1 && month <= 12;
  }, "Enter a valid month (01–12)");

export const uuidSchema = z.string().uuid("Invalid ID");

export function stripDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{10,15}$/.test(stripDigits(value)),
    "Phone must be 10–15 digits (country code + number)",
  );

export const optionalWhatsAppSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{10,15}$/.test(stripDigits(value)),
    "WhatsApp number must be 10–15 digits with country code (e.g. 91XXXXXXXXXX)",
  );

export function normalizeOptionalPhone(value: string): string | null {
  const digits = stripDigits(value);
  return digits || null;
}

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Enter a valid email address",
  );

export function normalizeOptionalEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

export function normalizeWhatsAppNumber(value: string): string | null {
  const digits = stripDigits(value);
  return digits || null;
}
