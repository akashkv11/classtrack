import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { summarizeRecords } from "@/lib/attendance";
import { formatISODate } from "@/lib/dates";
import { revalidateOperationalViews } from "@/lib/cache/revalidate-operational";
import { deleteAttendanceSession } from "@/lib/queries/attendance-sessions";

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
      timetableEntry: {
        select: {
          id: true,
          subject: true,
          startTime: true,
          endTime: true,
        },
      },
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
      whatsapp_number: session.class.whatsappNumber,
    },
    attendance_date: formatISODate(session.attendanceDate),
    timetable_entry_id: session.timetableEntryId,
    timetable_subject: session.timetableEntry?.subject ?? null,
    timetable_start_time: session.timetableEntry?.startTime ?? null,
    timetable_end_time: session.timetableEntry?.endTime ?? null,
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
  const result = await deleteAttendanceSession(sessionId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  revalidateOperationalViews(result.classId);

  return NextResponse.json({ success: true });
}
