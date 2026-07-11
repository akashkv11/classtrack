import { prisma } from "@/lib/db";

export async function validateTimetableEntryForClass(
  classId: string,
  timetableEntryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const entry = await prisma.timetableEntry.findFirst({
    where: {
      id: timetableEntryId,
      classId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false, error: "Timetable entry not found for this class" };
  }

  return { ok: true };
}
