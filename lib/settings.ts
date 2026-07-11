import { prisma } from "@/lib/db";
import type {
  AttendanceAlertThresholds,
  ReportSettings,
} from "@/lib/types/settings";

export const SETTING_MESSAGE_SIGNATURE = "message_signature";
export const SETTING_LATE_COUNTS_AS_PRESENT = "late_counts_as_present";
export const SETTING_LOW_ATTENDANCE_THRESHOLD = "low_attendance_threshold";
export const SETTING_CONTINUOUS_ABSENCE_THRESHOLD = "continuous_absence_threshold";
export const SETTING_MONTHLY_ABSENCE_THRESHOLD = "monthly_absence_threshold";
export const SETTING_LOW_MARKS_THRESHOLD_PERCENT = "low_marks_threshold_percent";
export const SETTING_TEACHER_NAME = "teacher_name";
export const SETTING_INSTITUTION_NAME = "institution_name";
export const SETTING_REPORT_TITLE = "report_title";
export const SETTING_REPORT_FOOTER = "report_footer";

const DEFAULTS: Record<string, string> = {
  [SETTING_MESSAGE_SIGNATURE]: "- Class Teacher",
  [SETTING_LATE_COUNTS_AS_PRESENT]: "true",
  [SETTING_LOW_ATTENDANCE_THRESHOLD]: "75",
  [SETTING_CONTINUOUS_ABSENCE_THRESHOLD]: "3",
  [SETTING_MONTHLY_ABSENCE_THRESHOLD]: "4",
  [SETTING_LOW_MARKS_THRESHOLD_PERCENT]: "40",
  [SETTING_TEACHER_NAME]: "",
  [SETTING_INSTITUTION_NAME]: "",
  [SETTING_REPORT_TITLE]: "",
  [SETTING_REPORT_FOOTER]: "Generated from ClassTrack",
};

function parseSettingNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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

export async function getAttendanceAlertThresholds(): Promise<AttendanceAlertThresholds> {
  const settings = await getAllSettings();
  return {
    lowAttendancePercent: parseSettingNumber(
      settings[SETTING_LOW_ATTENDANCE_THRESHOLD],
      75,
    ),
    continuousAbsenceMin: parseSettingNumber(
      settings[SETTING_CONTINUOUS_ABSENCE_THRESHOLD],
      3,
    ),
    frequentAbsenceMin: parseSettingNumber(
      settings[SETTING_MONTHLY_ABSENCE_THRESHOLD],
      4,
    ),
  };
}

export async function getLowMarksThresholdPercent(): Promise<number> {
  const settings = await getAllSettings();
  return parseSettingNumber(settings[SETTING_LOW_MARKS_THRESHOLD_PERCENT], 40);
}

export async function getReportSettings(): Promise<ReportSettings> {
  const settings = await getAllSettings();
  return {
    teacher_name: settings[SETTING_TEACHER_NAME] ?? "",
    institution_name: settings[SETTING_INSTITUTION_NAME] ?? "",
    report_title: settings[SETTING_REPORT_TITLE] ?? "",
    message_signature: settings[SETTING_MESSAGE_SIGNATURE] ?? DEFAULTS[SETTING_MESSAGE_SIGNATURE],
    report_footer: settings[SETTING_REPORT_FOOTER] ?? DEFAULTS[SETTING_REPORT_FOOTER],
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export function mapSettingsRecord(settings: Record<string, string>) {
  return {
    message_signature: settings[SETTING_MESSAGE_SIGNATURE],
    late_counts_as_present: settings[SETTING_LATE_COUNTS_AS_PRESENT] !== "false",
    low_attendance_threshold: parseSettingNumber(
      settings[SETTING_LOW_ATTENDANCE_THRESHOLD],
      75,
    ),
    continuous_absence_threshold: parseSettingNumber(
      settings[SETTING_CONTINUOUS_ABSENCE_THRESHOLD],
      3,
    ),
    monthly_absence_threshold: parseSettingNumber(
      settings[SETTING_MONTHLY_ABSENCE_THRESHOLD],
      4,
    ),
    low_marks_threshold_percent: parseSettingNumber(
      settings[SETTING_LOW_MARKS_THRESHOLD_PERCENT],
      40,
    ),
    teacher_name: settings[SETTING_TEACHER_NAME] ?? "",
    institution_name: settings[SETTING_INSTITUTION_NAME] ?? "",
    report_title: settings[SETTING_REPORT_TITLE] ?? "",
    report_footer: settings[SETTING_REPORT_FOOTER] ?? DEFAULTS[SETTING_REPORT_FOOTER],
  };
}
