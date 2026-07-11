import {
  flattenSubtopicLabels,
  labelsToTopicBullets,
  mapSubtopicsFromDb,
  parseSubtopicsCoveredFromDb,
} from "@/lib/syllabus/subtopics";

type Absentee = {
  rollNo?: number;
  fullName: string;
  monthlyAbsentCount?: number;
};

export function formatAbsenteeLine(student: Absentee): string {
  if (student.monthlyAbsentCount && student.monthlyAbsentCount > 1) {
    return `${student.fullName} (${student.monthlyAbsentCount} class absent)`;
  }
  return student.fullName;
}

export function subjectForStream(stream: string): string | null {
  if (stream === "science") return "Computer Science";
  if (stream === "commerce") return "Computer Applications";
  return null;
}

export function formatWhatsAppDate(date: Date): string {
  const day = date.getUTCDate();
  const month = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatWhatsAppTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatClassTimeRange(startTime: string, endTime: string): string {
  return `${formatWhatsAppTime(startTime)} - ${formatWhatsAppTime(endTime)}`;
}

export function buildTopicTakenFromDiary(entry: {
  topicTaught: string;
  subtopicsCovered?: unknown;
  syllabusTopic: {
    topicTitle: string;
    subtopics: unknown;
  } | null;
}): { title: string; bullets: string[] } | null {
  if (entry.syllabusTopic) {
    const title = entry.syllabusTopic.topicTitle.trim();
    if (!title) return null;

    const covered = parseSubtopicsCoveredFromDb(entry.subtopicsCovered);
    if (covered.length > 0) {
      return { title, bullets: labelsToTopicBullets(covered) };
    }

    return {
      title,
      bullets: labelsToTopicBullets(
        flattenSubtopicLabels(mapSubtopicsFromDb(entry.syllabusTopic.subtopics)),
      ),
    };
  }

  const fallbackTitle = entry.topicTaught.trim();
  return fallbackTitle ? { title: fallbackTitle, bullets: [] } : null;
}

export type ClassUpdateMessageOptions = {
  className: string;
  date: Date;
  subject?: string | null;
  classTime?: string | null;
  absentees: Absentee[];
  topicTaken?: { title: string; bullets: string[] } | null;
  whatsappChannelUrl?: string | null;
};

export function buildClassUpdateMessage(options: ClassUpdateMessageOptions): string {
  const lines = [
    `Class Update - ${options.className}`,
    `Date: ${formatWhatsAppDate(options.date)}`,
  ];

  if (options.subject) {
    lines.push(`Subject: ${options.subject}`);
  }

  if (options.classTime) {
    lines.push(`Class Time: ${options.classTime}`);
  }

  lines.push("", "Absentees:");

  if (options.absentees.length === 0) {
    lines.push("No absentees today.");
  } else {
    options.absentees.forEach((student, index) => {
      lines.push(`${index + 1}. ${formatAbsenteeLine(student)}`);
    });
  }

  lines.push("", "Topic Taken:");

  if (options.topicTaken?.title) {
    lines.push(options.topicTaken.title);
    lines.push(...options.topicTaken.bullets);
  } else {
    lines.push("Not added in teaching diary yet.");
  }

  if (options.whatsappChannelUrl) {
    lines.push(
      "",
      "Study Materials:",
      "Notes and practice materials are available in the class WhatsApp channel:",
      options.whatsappChannelUrl,
    );
  }

  lines.push(
    "",
    "Note: Absent students please copy notes. All students please revise today's topic before the next class.",
  );

  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const normalized = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function setMessageClassTime(message: string, classTime: string | null): string {
  const trimmed = classTime?.trim() ?? "";
  const lines = message.split("\n").filter((line) => !line.startsWith("Class Time:"));

  if (!trimmed) {
    return lines.join("\n");
  }

  const classTimeLine = `Class Time: ${trimmed}`;
  const subjectIndex = lines.findIndex((line) => line.startsWith("Subject:"));
  const dateIndex = lines.findIndex((line) => line.startsWith("Date:"));
  const insertAfter = subjectIndex >= 0 ? subjectIndex : dateIndex;

  if (insertAfter >= 0) {
    lines.splice(insertAfter + 1, 0, classTimeLine);
  } else {
    lines.splice(1, 0, classTimeLine);
  }

  return lines.join("\n");
}
