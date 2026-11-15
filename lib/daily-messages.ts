import { buildClassUpdateMessage, buildSeparateClassUpdateMessage, formatClassTimeRange, formatWhatsAppDate } from "@/lib/whatsapp";

export type DailySession = {
  id: string; subject: string | null; start_time: string | null; end_time: string | null;
  diary_status: string | null; chapter: string | null;
  topics: { title: string; bullets: string[] } | null;
  attendance_recorded: boolean;
  absentees: { id: string; name: string; monthly_absent_count?: number }[];
  late_students: { id: string; name: string }[];
};
export type DailyMessageDetails = { class_name: string; date: string; sessions: DailySession[]; channel_url: string | null };
const labels: Record<string, string> = { TAUGHT: "Regular Class", PARTIALLY_TAUGHT: "Partially taught", EXAM: "Exam", REVISION: "Revision", CANCELLED: "Cancelled" };
const subject = (s: DailySession) => s.subject || "Subject not recorded";
const time = (s: DailySession) => s.start_time && s.end_time ? formatClassTimeRange(s.start_time, s.end_time) : "Time not recorded";
const chapter = (s: DailySession) => s.chapter || "Not recorded";

export function buildDailyClassMessage(details: DailyMessageDetails): string {
  const { sessions } = details;
  if (sessions.length === 1) {
    const s = sessions[0];
    return buildClassUpdateMessage({ className: details.class_name, date: new Date(`${details.date}T00:00:00Z`), subject: s.subject,
      classTime: s.start_time && s.end_time ? formatClassTimeRange(s.start_time, s.end_time) : null,
      diaryStatus: s.diary_status, chapter: s.chapter, topicTaken: s.diary_status ? s.topics : { title: "Diary not recorded.", bullets: [] },
      attendanceRecorded: s.attendance_recorded, absentees: s.absentees.map(a => ({ fullName: a.name, monthlyAbsentCount: a.monthly_absent_count })), whatsappChannelUrl: details.channel_url });
  }
  const lines = [`DAILY CLASS UPDATE — ${details.class_name}`, `Date: ${formatWhatsAppDate(new Date(`${details.date}T00:00:00Z`))}`];
  sessions.forEach((s, i) => {
    lines.push("", `SESSION ${i + 1} — ${subject(s)}`, `${time(s)} · ${labels[s.diary_status ?? ""] ?? "Type not recorded"}`, "");
    if (s.diary_status === "CANCELLED") { lines.push("Class cancelled."); return; }
    if (!s.diary_status) lines.push("Diary not recorded.");
    else {
      lines.push(`Chapter: ${chapter(s)}`);
      if (s.diary_status !== "EXAM") lines.push("Topics covered:", s.topics?.title || "Not recorded", ...(s.topics?.bullets ?? []));
    }
    lines.push("", "Absentees:", ...(!s.attendance_recorded ? ["Attendance not recorded."] : s.absentees.length ? s.absentees.map((a, j) => `${j + 1}. ${a.name}`) : ["No absentees."]));
  });
  if (details.channel_url) lines.push("", "STUDY MATERIALS", "Notes and practice materials are available in the class WhatsApp channel:", details.channel_url);
  const notes: string[] = [];
  if (sessions.some(s => s.diary_status === "EXAM")) notes.push("Students who missed the exam, please contact the teacher.");
  if (sessions.some(s => ["TAUGHT", "PARTIALLY_TAUGHT", "REVISION"].includes(s.diary_status ?? ""))) notes.push("Absent students, please catch up on missed classwork. Everyone, please revise today’s topics.");
  if (sessions.every(s => s.diary_status === "CANCELLED")) notes.push("Today’s classes were cancelled. Please check the next scheduled class timing.");
  if (notes.length) lines.push("", `Note: ${notes.join(" ")}`);
  return lines.join("\n");
}

export function buildDailySeparateMessage(details: DailyMessageDetails, preparationLines: string[], homework?: string | null): string {
  const { sessions } = details;
  if (sessions.length === 1) {
    const s = sessions[0];
    return buildSeparateClassUpdateMessage({ className: details.class_name, date: new Date(`${details.date}T00:00:00Z`), subject: s.subject,
      chapter: s.chapter || "Not recorded", topics: s.topics, diaryStatus: s.diary_status, attendanceRecorded: s.attendance_recorded,
      absentees: s.absentees.map(a => a.name), lateStudents: s.late_students.map(a => a.name), preparationLines, homework });
  }
  const lines = ["CLASS UPDATE", "", `*CLASS:* ${details.class_name}`, `*DATE:* ${formatWhatsAppDate(new Date(`${details.date}T00:00:00Z`))}`,
    `*SUBJECTS:* ${[...new Set(sessions.map(subject))].join(", ")}`];
  const describe = (s: DailySession) => {
    const repeated = sessions.filter(other => subject(other) === subject(s)).length > 1;
    return `${subject(s)}${repeated ? ` (${time(s)})` : ""}`;
  };
  const exams = sessions.filter(s => s.diary_status === "EXAM");
  if (exams.length) lines.push("", "*EXAM*", ...exams.map(s => `${describe(s)} — Chapter: ${chapter(s)}`));
  const classes = sessions.filter(s => s.diary_status !== "EXAM");
  if (classes.length) lines.push("", "*CLASSWORK*", ...classes.map(s => s.diary_status === "CANCELLED" ? `${describe(s)} — Cancelled` : !s.diary_status ? `${describe(s)} — Diary not recorded` : `${describe(s)} — ${labels[s.diary_status] ?? s.diary_status}\nChapter: ${chapter(s)}\nTopics: ${s.topics?.title ?? "Not recorded"}${s.topics?.bullets.length ? `\n${s.topics.bullets.join("\n")}` : ""}`));
  lines.push("", `*HW:* ${homework?.trim() || "No homework assigned."}`);
  for (const [heading, field] of [["ABSENTEES", "absentees"], ["LATE STUDENTS", "late_students"]] as const) {
    const people = new Map<string, { name: string; labels: Set<string> }>();
    const active = sessions.filter(s => s.diary_status !== "CANCELLED");
    for (const s of active) for (const person of s[field]) {
      const item = people.get(person.id) ?? { name: person.name, labels: new Set<string>() };
      item.labels.add(describe(s)); people.set(person.id, item);
    }
    lines.push("", `*${heading}*`, ...[...people.values()].map((p, i) => `${i + 1}) ${p.name} — ${[...p.labels].join("; ")}`));
    const missing = active.filter(s => !s.attendance_recorded);
    if (missing.length) lines.push(`Attendance not recorded: ${missing.map(describe).join("; ")}.`);
    if (!people.size && !missing.length) lines.push(active.length ? "None" : "Not applicable (cancelled)");
  }
  lines.push("", "*UNPREPARED STUDENTS — DAILY PREPARATION*", ...(preparationLines.length ? preparationLines : ["Preparation not recorded."]));
  return lines.join("\n");
}
