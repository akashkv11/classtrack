import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export function attendanceSessionSlotWhere(
  classId: string,
  attendanceDate: Date,
  timetableEntryId: string | null,
) {
  return {
    classId,
    attendanceDate,
    timetableEntryId,
  };
}

export async function findAttendanceSessionForSlot(
  classId: string,
  attendanceDate: Date,
  timetableEntryId: string | null,
) {
  return prisma.attendanceSession.findFirst({
    where: attendanceSessionSlotWhere(classId, attendanceDate, timetableEntryId),
    include: { records: true },
  });
}

export async function upsertAttendanceSessionForSlot(
  tx: Prisma.TransactionClient,
  options: {
    classId: string;
    attendanceDate: Date;
    timetableEntryId: string | null;
    notes: string;
  },
) {
  const existing = await tx.attendanceSession.findFirst({
    where: attendanceSessionSlotWhere(
      options.classId,
      options.attendanceDate,
      options.timetableEntryId,
    ),
  });

  if (existing) {
    return tx.attendanceSession.update({
      where: { id: existing.id },
      data: { notes: options.notes },
    });
  }

  return tx.attendanceSession.create({
    data: {
      classId: options.classId,
      attendanceDate: options.attendanceDate,
      timetableEntryId: options.timetableEntryId,
      notes: options.notes,
    },
  });
}
