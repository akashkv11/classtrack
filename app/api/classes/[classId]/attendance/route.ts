import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { summarizeRecords, isAttendanceStatus } from "@/lib/attendance";
import { parseISODate } from "@/lib/dates";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const dateParam = request.nextUrl.searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const attendanceDate = parseISODate(dateParam);

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: { rollNo: "asc" },
  });

  const session = await prisma.attendanceSession.findUnique({
    where: {
      classId_attendanceDate: { classId, attendanceDate },
    },
    include: {
      records: true,
    },
  });

  const recordMap = new Map(
    session?.records.map((r) => [r.studentId, r.status]) ?? [],
  );

  const records = students.map((student) => ({
    student_id: student.id,
    roll_no: student.rollNo,
    full_name: student.fullName,
    status: recordMap.get(student.id) ?? "present",
  }));

  if (!session) {
    return NextResponse.json({
      exists: false,
      session: null,
      records,
    });
  }

  return NextResponse.json({
    exists: true,
    session: {
      id: session.id,
      class_id: session.classId,
      attendance_date: dateParam,
      notes: session.notes ?? "",
    },
    records,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();

  const dateStr =
    typeof body.attendance_date === "string" ? body.attendance_date : "";
  const notes = typeof body.notes === "string" ? body.notes : "";
  const inputRecords = Array.isArray(body.records) ? body.records : [];

  if (!dateStr) {
    return NextResponse.json({ error: "attendance_date is required" }, { status: 400 });
  }

  const attendanceDate = parseISODate(dateStr);

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
  });
  const studentIds = new Set(students.map((s) => s.id));

  const validatedRecords: { studentId: string; status: string }[] = [];
  for (const record of inputRecords) {
    const studentId = record.student_id;
    const status = record.status;
    if (
      typeof studentId !== "string" ||
      !studentIds.has(studentId) ||
      !isAttendanceStatus(status)
    ) {
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
    const upserted = await tx.attendanceSession.upsert({
      where: {
        classId_attendanceDate: { classId, attendanceDate },
      },
      create: {
        classId,
        attendanceDate,
        notes,
      },
      update: { notes },
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
