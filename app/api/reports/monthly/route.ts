import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  calculateAttendancePercentage,
  type AttendanceStatus,
} from "@/lib/attendance";
import { lateCountsAsPresent } from "@/lib/settings";
import { endOfMonth, startOfMonth } from "@/lib/dates";
import {
  monthQuerySchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const parsed = parseInput(monthQuerySchema, {
    class_id: request.nextUrl.searchParams.get("class_id") ?? "",
    month: request.nextUrl.searchParams.get("month") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const { class_id: classId, month: monthParam } = parsed.data;
  const [yearStr, monthStr] = monthParam.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const rangeStart = startOfMonth(year, month);
  const rangeEnd = endOfMonth(year, month);

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId,
      attendanceDate: { gte: rangeStart, lte: rangeEnd },
    },
    include: {
      records: {
        include: { student: true },
      },
    },
    orderBy: { attendanceDate: "asc" },
  });

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: { rollNo: "asc" },
  });

  const lateAsPresent = await lateCountsAsPresent();
  const workingDays = sessions.length;

  const reportStudents = students.map((student) => {
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    for (const session of sessions) {
      const record = session.records.find((r) => r.studentId === student.id);
      if (!record) continue;
      const status = record.status as AttendanceStatus;
      if (status === "present") presentDays += 1;
      if (status === "absent") absentDays += 1;
      if (status === "late") lateDays += 1;
    }

    return {
      roll_no: student.rollNo,
      full_name: student.fullName,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      attendance_percentage: calculateAttendancePercentage({
        presentDays,
        lateDays,
        workingDays,
        lateCountsAsPresent: lateAsPresent,
      }),
    };
  });

  return NextResponse.json({
    class: {
      id: cls.id,
      display_name: cls.displayName,
    },
    month: monthParam,
    working_days: workingDays,
    students: reportStudents,
  });
}
