/** Keep existing Indian country-code numbers editable as ten local digits. */
export function parentPhoneInputValue(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 14 && digits.startsWith("0091")) return digits.slice(4);
  return digits;
}

export function parentPhoneCallUrl(phone: string): string {
  const digits = parentPhoneInputValue(phone);
  if (digits.length === 10) return `tel:+91${digits}`;
  // Preserve existing international numbers rather than adding a second country code.
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}
