import { formatDisplayDate } from "@/lib/dates";

type Absentee = {
  rollNo: number;
  fullName: string;
};

export function subjectForStream(stream: string): string | null {
  if (stream === "science") return "Computer Science";
  if (stream === "commerce") return "Computer Application";
  return null;
}

export function buildAbsenteeMessage(options: {
  className: string;
  subject?: string | null;
  date: Date;
  absentees: Absentee[];
}): string {
  const { className, subject, date, absentees } = options;
  const dateStr = formatDisplayDate(date);

  const lines = [
    "Attendance Update",
    "",
    `Class: ${className}`,
  ];

  if (subject) {
    lines.push(`Subject: ${subject}`);
  }

  lines.push(`Date: ${dateStr}`, "");

  if (absentees.length === 0) {
    lines.push("All students are present today.");
  } else {
    lines.push("Absentees:");
    absentees.forEach((student, index) => {
      lines.push(`${index + 1}. ${student.fullName}`);
    });
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const normalized = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
