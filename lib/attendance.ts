export type AttendanceStatus = "present" | "absent" | "late";

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return value === "present" || value === "absent" || value === "late";
}

export function summarizeRecords(
  records: { status: string }[],
): { total: number; present: number; absent: number; late: number } {
  return records.reduce(
    (acc, record) => {
      acc.total += 1;
      if (record.status === "present") acc.present += 1;
      if (record.status === "absent") acc.absent += 1;
      if (record.status === "late") acc.late += 1;
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0 },
  );
}

export function calculateAttendancePercentage(options: {
  presentDays: number;
  lateDays: number;
  workingDays: number;
  lateCountsAsPresent: boolean;
}): number {
  const { presentDays, lateDays, workingDays, lateCountsAsPresent } = options;
  if (workingDays === 0) return 0;
  const attended = lateCountsAsPresent
    ? presentDays + lateDays
    : presentDays;
  return Math.round((attended / workingDays) * 1000) / 10;
}
