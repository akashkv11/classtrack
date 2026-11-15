import type { Prisma } from "@/app/generated/prisma/client";
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
    timetable_subject: session.subject ?? null,
    timetable_start_time: session.startTime ?? null,
    timetable_end_time: session.endTime ?? null,
    record_count: session._count.records,
    created_at: session.createdAt.toISOString(),
  }));
}

export async function deleteAttendanceSession(sessionId: string) {
  const existing = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, classId: true },
  });

  if (!existing) {
    return { ok: false as const, error: "Session not found" };
  }

  await prisma.attendanceSession.delete({ where: { id: sessionId } });
  return { ok: true as const, classId: existing.classId };
}

export async function upsertAttendanceSessionForSlot(
  tx: Prisma.TransactionClient,
  options: {
    classId: string; attendanceDate: Date; timetableEntryId: string | null;
    notes: string; sessionId?: string | null;
    subject?: string; startTime?: string; endTime?: string;
  },
) {
  if (options.sessionId) {
    return tx.attendanceSession.update({
      where: { id: options.sessionId, classId: options.classId, attendanceDate: options.attendanceDate },
      data: { notes: options.notes },
    });
  }
  const timetable = options.timetableEntryId
    ? await tx.timetableEntry.findUniqueOrThrow({ where: { id: options.timetableEntryId, classId: options.classId } })
    : null;
  const data = {
    classId: options.classId, attendanceDate: options.attendanceDate,
    timetableEntryId: options.timetableEntryId, notes: options.notes,
    subject: timetable?.subject ?? options.subject,
    startTime: timetable?.startTime ?? options.startTime,
    endTime: timetable?.endTime ?? options.endTime,
  };
  if (!options.timetableEntryId) return tx.attendanceSession.create({ data });
  return tx.attendanceSession.upsert({
    where: { classId_attendanceDate_timetableEntryId: {
      classId: options.classId, attendanceDate: options.attendanceDate, timetableEntryId: options.timetableEntryId,
    } },
    create: data, update: { notes: options.notes },
  });
}
