import {
  flattenSubtopicLabels,
  labelsToTopicBullets,
  mapSubtopicsFromDb,
  parseSubtopicsCoveredFromDb,
} from "@/lib/syllabus/subtopics";
import type { DiaryStatus } from "@/lib/types/teaching-diary";

type Absentee = {
  rollNo?: number;
  fullName: string;
  monthlyAbsentCount?: number;
};

export type WhatsAppSessionKind = "CLASS" | "EXAM" | "REVISION" | "CANCELLED";

export function resolveWhatsAppSessionKind(
  diaryStatus?: DiaryStatus | string | null,
): WhatsAppSessionKind {
  switch (diaryStatus) {
    case "EXAM":
      return "EXAM";
    case "REVISION":
      return "REVISION";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "CLASS";
  }
}

function sessionMessageCopy(kind: WhatsAppSessionKind): {
  headerPrefix: string;
  detailsHeading: string;
  emptyDetails: string;
  studyMaterialsIntro: string;
  closingNote: string;
} {
  switch (kind) {
    case "EXAM":
      return {
        headerPrefix: "Exam Update",
        detailsHeading: "Exam:",
        emptyDetails: "Exam details not added in teaching diary yet.",
        studyMaterialsIntro:
          "Exam-related notes and materials are available in the class WhatsApp channel:",
        closingNote:
          "Note: Absent students please contact the teacher about today's exam. All students please prepare the remaining portions for the next class.",
      };
    case "REVISION":
      return {
        headerPrefix: "Revision Update",
        detailsHeading: "Chapter Revision:",
        emptyDetails: "Revision focus not added in teaching diary yet.",
        studyMaterialsIntro:
          "Revision notes and practice materials are available in the class WhatsApp channel:",
        closingNote:
          "Note: Absent students please copy revision notes. All students please practice the revised portions before the next class.",
      };
    case "CANCELLED":
      return {
        headerPrefix: "Class Update",
        detailsHeading: "Session:",
        emptyDetails: "Class was cancelled. Details not added in teaching diary yet.",
        studyMaterialsIntro:
          "Study materials are available in the class WhatsApp channel:",
        closingNote:
          "Note: Today's class was cancelled. Please check the next scheduled class timing.",
      };
    default:
      return {
        headerPrefix: "Class Update",
        detailsHeading: "Topic Taken:",
        emptyDetails: "Not added in teaching diary yet.",
        studyMaterialsIntro:
          "Notes and practice materials are available in the class WhatsApp channel:",
        closingNote:
          "Note: Absent students please copy notes. All students please revise today's topic before the next class.",
      };
  }
}

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
  /** Diary session type — drives exam / revision / class wording */
  diaryStatus?: DiaryStatus | string | null;
};

export function buildClassUpdateMessage(options: ClassUpdateMessageOptions): string {
  const kind = resolveWhatsAppSessionKind(options.diaryStatus);
  const copy = sessionMessageCopy(kind);

  const lines = [
    `${copy.headerPrefix} - ${options.className}`,
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

  lines.push("", copy.detailsHeading);

  if (options.topicTaken?.title) {
    lines.push(options.topicTaken.title);
    lines.push(...options.topicTaken.bullets);
  } else {
    lines.push(copy.emptyDetails);
  }

  if (options.whatsappChannelUrl) {
    lines.push(
      "",
      "Study Materials:",
      copy.studyMaterialsIntro,
      options.whatsappChannelUrl,
    );
  }

  lines.push("", copy.closingNote);

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
