export const PREPARATION_LABELS = {
  NOT_MARKED: "Not marked",
  FULL: "Fully prepared",
  PARTIAL: "Partially prepared",
  NONE: "Not prepared",
} as const;

export type PreparationStatus = keyof typeof PREPARATION_LABELS;
export type PreparationStudent = {
  student_id: string;
  roll_no: number;
  full_name: string;
  preparation_status: PreparationStatus;
  previous_streak: number;
};

export function countsAsUnprepared(status: string, includePartial = false): boolean {
  return status === "NONE" || (includePartial && status === "PARTIAL");
}

/** Histories are supplied newest first. Unmarked and fully prepared records break a run. */
export function preparationStreak(statuses: string[], includePartial = false): number {
  let count = 0;
  for (const status of statuses) {
    if (!countsAsUnprepared(status, includePartial)) break;
    count++;
  }
  return count;
}

export function preparationMessageLines(
  students: Pick<PreparationStudent, "full_name" | "preparation_status" | "previous_streak">[],
  includePartial = false,
): string[] {
  const flagged = students.filter((student) => countsAsUnprepared(student.preparation_status, true));
  const lines = flagged.map((student, index) => {
    const status = PREPARATION_LABELS[student.preparation_status].toLowerCase();
    const count = student.previous_streak + 1;
    const streak = countsAsUnprepared(student.preparation_status, includePartial)
      ? `; ${count} consecutive unprepared class${count === 1 ? "" : "es"}`
      : "";
    return `${index + 1}) ${student.full_name} (${status}${streak})`;
  });
  const unmarked = students.filter((student) => student.preparation_status === "NOT_MARKED").length;
  if (lines.length === 0 && unmarked === 0) lines.push("None");
  if (unmarked > 0) lines.push(`Preparation not marked for ${unmarked} student${unmarked === 1 ? "" : "s"}.`);
  return lines;
}
