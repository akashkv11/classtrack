import { formatDisplayDate } from "@/lib/dates";

type Absentee = {
  rollNo: number;
  fullName: string;
};

export function buildAbsenteeMessage(options: {
  className: string;
  date: Date;
  absentees: Absentee[];
  signature: string;
}): string {
  const { className, date, absentees, signature } = options;
  const dateStr = formatDisplayDate(date);

  const lines = [
    "Attendance Update",
    "",
    `Class: ${className}`,
    `Date: ${dateStr}`,
    "",
  ];

  if (absentees.length === 0) {
    lines.push("All students are present today.");
  } else {
    lines.push("Absentees:");
    absentees.forEach((student, index) => {
      lines.push(`${index + 1}. ${student.fullName}`);
    });
  }

  lines.push("", signature);
  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const normalized = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
