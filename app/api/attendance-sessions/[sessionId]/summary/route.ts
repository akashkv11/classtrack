import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { summarizeRecords } from "@/lib/attendance";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { sessionId } = await context.params;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      records: {
        include: { student: true },
        orderBy: { student: { rollNo: "asc" } },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const absentees = session.records
    .filter((r) => r.status === "absent")
    .map((r) => ({ roll_no: r.student.rollNo, full_name: r.student.fullName }));

  const lateStudents = session.records
    .filter((r) => r.status === "late")
    .map((r) => ({ roll_no: r.student.rollNo, full_name: r.student.fullName }));

  return NextResponse.json({
    session_id: session.id,
    class: {
      id: session.class.id,
      display_name: session.class.displayName,
    },
    attendance_date: session.attendanceDate.toISOString().slice(0, 10),
    summary: summarizeRecords(session.records),
    absentees,
    late_students: lateStudents,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { sessionId } = await context.params;

  await prisma.attendanceSession.delete({ where: { id: sessionId } });

  return NextResponse.json({ success: true });
}
