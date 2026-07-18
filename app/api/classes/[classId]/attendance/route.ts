import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { summarizeRecords, isAttendanceStatus } from "@/lib/attendance";
import { parseISODate } from "@/lib/dates";
import {
  findAttendanceSessionForSlot,
  listAttendanceSessionsForDate,
  upsertAttendanceSessionForSlot,
} from "@/lib/queries/attendance-sessions";
import { validateTimetableEntryForClass } from "@/lib/timetable/access";
import {
  attendanceDateQuerySchema,
  attendanceSaveSchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const dateParam = request.nextUrl.searchParams.get("date");
  const timetableEntryId = request.nextUrl.searchParams.get("timetable_entry_id");
  const parsed = parseInput(attendanceDateQuerySchema, {
    date: dateParam ?? "",
    timetable_entry_id: timetableEntryId,
  });

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const attendanceDate = parseISODate(parsed.data.date);
  const slotTimetableId = parsed.data.timetable_entry_id ?? null;

  if (slotTimetableId) {
    const timetableCheck = await validateTimetableEntryForClass(classId, slotTimetableId);
    if (!timetableCheck.ok) {
      return NextResponse.json({ error: timetableCheck.error }, { status: 400 });
    }
  }

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: { rollNo: "asc" },
  });

  const [session, sessionsOnDate] = await Promise.all([
    findAttendanceSessionForSlot(classId, attendanceDate, slotTimetableId),
    listAttendanceSessionsForDate(classId, attendanceDate),
  ]);

  const recordMap = new Map(
    session?.records.map((r) => [r.studentId, r.status]) ?? [],
  );

  const records = students.map((student) => ({
    student_id: student.id,
    roll_no: student.rollNo,
    full_name: student.fullName,
    status: recordMap.get(student.id) ?? "absent",
  }));

  if (!session) {
    return NextResponse.json({
      exists: false,
      session: null,
      records,
      sessions_on_date: sessionsOnDate,
    });
  }

  return NextResponse.json({
    exists: true,
    session: {
      id: session.id,
      class_id: session.classId,
      attendance_date: parsed.data.date,
      timetable_entry_id: session.timetableEntryId,
      notes: session.notes ?? "",
    },
    records,
    sessions_on_date: sessionsOnDate,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(attendanceSaveSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const { attendance_date, notes = "", records: inputRecords, timetable_entry_id } =
    parsed.data;
  const attendanceDate = parseISODate(attendance_date);
  const slotTimetableId = timetable_entry_id ?? null;

  if (slotTimetableId) {
    const timetableCheck = await validateTimetableEntryForClass(
      classId,
      slotTimetableId,
    );
    if (!timetableCheck.ok) {
      return NextResponse.json({ error: timetableCheck.error }, { status: 400 });
    }
  }

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
  });
  const studentIds = new Set(students.map((s) => s.id));

  const validatedRecords: { studentId: string; status: string }[] = [];
  for (const record of inputRecords) {
    const { student_id: studentId, status } = record;
    if (!studentIds.has(studentId) || !isAttendanceStatus(status)) {
      continue;
    }
    validatedRecords.push({ studentId, status });
  }

  if (validatedRecords.length !== students.length) {
    return NextResponse.json(
      { error: "All active students must have an attendance record" },
      { status: 400 },
    );
  }

  const session = await prisma.$transaction(async (tx) => {
    const upserted = await upsertAttendanceSessionForSlot(tx, {
      classId,
      attendanceDate,
      timetableEntryId: slotTimetableId,
      notes,
    });

    for (const record of validatedRecords) {
      await tx.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: upserted.id,
            studentId: record.studentId,
          },
        },
        create: {
          sessionId: upserted.id,
          studentId: record.studentId,
          status: record.status,
        },
        update: { status: record.status },
      });
    }

    return upserted;
  });

  const savedRecords = await prisma.attendanceRecord.findMany({
    where: { sessionId: session.id },
  });

  return NextResponse.json({
    success: true,
    session_id: session.id,
    summary: summarizeRecords(savedRecords),
  });
}
