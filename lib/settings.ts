import { prisma } from "@/lib/db";

export const SETTING_MESSAGE_SIGNATURE = "message_signature";
export const SETTING_LATE_COUNTS_AS_PRESENT = "late_counts_as_present";

const DEFAULTS: Record<string, string> = {
  [SETTING_MESSAGE_SIGNATURE]: "- Class Teacher",
  [SETTING_LATE_COUNTS_AS_PRESENT]: "true",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getMessageSignature(): Promise<string> {
  return getSetting(SETTING_MESSAGE_SIGNATURE);
}

export async function lateCountsAsPresent(): Promise<boolean> {
  const value = await getSetting(SETTING_LATE_COUNTS_AS_PRESENT);
  return value !== "false";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getAllSettings() {
  const rows = await prisma.appSetting.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}
