import type { Prisma } from "@/app/generated/prisma/client";
import { isUniqueConstraintError } from "@/lib/db/prisma-errors";
import { prisma } from "@/lib/db";
import { formatISODate } from "@/lib/dates";

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

export async function listAttendanceSessionsForDate(
  classId: string,
  attendanceDate: Date,
) {
  const sessions = await prisma.attendanceSession.findMany({
    where: { classId, attendanceDate },
    include: {
      timetableEntry: {
        select: {
          id: true,
          subject: true,
          startTime: true,
          endTime: true,
        },
      },
      _count: { select: { records: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return sessions.map((session) => ({
    id: session.id,
    attendance_date: formatISODate(session.attendanceDate),
    timetable_entry_id: session.timetableEntryId,
    timetable_subject: session.timetableEntry?.subject ?? null,
    timetable_start_time: session.timetableEntry?.startTime ?? null,
    timetable_end_time: session.timetableEntry?.endTime ?? null,
    record_count: session._count.records,
    created_at: session.createdAt.toISOString(),
  }));
}

export async function deleteAttendanceSession(sessionId: string) {
  const existing = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false as const, error: "Session not found" };
  }

  await prisma.attendanceSession.delete({ where: { id: sessionId } });
  return { ok: true as const };
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
  const slotWhere = attendanceSessionSlotWhere(
    options.classId,
    options.attendanceDate,
    options.timetableEntryId,
  );

  const existing = await tx.attendanceSession.findFirst({
    where: slotWhere,
  });

  if (existing) {
    return tx.attendanceSession.update({
      where: { id: existing.id },
      data: { notes: options.notes },
    });
  }

  try {
    return await tx.attendanceSession.create({
      data: {
        classId: options.classId,
        attendanceDate: options.attendanceDate,
        timetableEntryId: options.timetableEntryId,
        notes: options.notes,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const raced = await tx.attendanceSession.findFirst({ where: slotWhere });
    if (!raced) throw error;

    return tx.attendanceSession.update({
      where: { id: raced.id },
      data: { notes: options.notes },
    });
  }
}
