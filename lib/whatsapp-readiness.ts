import { buildTeachingDiaryLink } from "@/lib/timetable/links";

export type WhatsAppMissingItemId = "whatsapp_channel" | "teaching_diary";

export type WhatsAppMissingItem = {
  id: WhatsAppMissingItemId;
  label: string;
  description: string;
  fix_href: string;
};

export function getWhatsAppMissingItems(options: {
  classId: string;
  attendanceDate: string;
  whatsappChannelUrl: string | null;
  diaryEntry: unknown | null;
}): WhatsAppMissingItem[] {
  const missing: WhatsAppMissingItem[] = [];
  const settingsHref = `/classes/${options.classId}/settings`;
  const diaryHref = buildTeachingDiaryLink(options.classId, {
    date: options.attendanceDate,
    openForm: true,
  });

  if (!options.whatsappChannelUrl) {
    missing.push({
      id: "whatsapp_channel",
      label: "WhatsApp channel link",
      description: "Add the class WhatsApp channel link so study materials can be included.",
      fix_href: settingsHref,
    });
  }

  if (!options.diaryEntry) {
    missing.push({
      id: "teaching_diary",
      label: "Teaching diary entry",
      description: "Add today's teaching diary entry with the topic taught.",
      fix_href: diaryHref,
    });
  }

  return missing;
}
