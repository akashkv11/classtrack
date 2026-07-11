import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { todayISO, parseISODate } from "@/lib/dates";
import {
  classCreateSchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  if (!activeYear) {
    return NextResponse.json([]);
  }

  const today = todayISO();
  const classes = await prisma.class.findMany({
    where: { academicYearId: activeYear.id, isActive: true },
    orderBy: [{ level: "asc" }, { stream: "asc" }],
    include: {
      _count: { select: { students: { where: { isActive: true } } } },
      attendanceSessions: {
        where: { attendanceDate: parseISODate(today) },
        take: 1,
      },
    },
  });

  const result = classes.map((cls) => ({
    id: cls.id,
    display_name: cls.displayName,
    level: cls.level,
    stream: cls.stream,
    whatsapp_number: cls.whatsappNumber,
    student_count: cls._count.students,
    today_status: cls.attendanceSessions.length > 0 ? "marked" : "not_marked",
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const parsed = parseInput(classCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  if (!activeYear) {
    return NextResponse.json(
      { error: "No active academic year. Create one in Settings first." },
      { status: 400 },
    );
  }

  try {
    const cls = await prisma.class.create({
      data: {
        academicYearId: activeYear.id,
        level: parsed.data.level,
        stream: parsed.data.stream,
        displayName: parsed.data.display_name,
      },
    });

    return NextResponse.json({
      id: cls.id,
      display_name: cls.displayName,
      level: cls.level,
      stream: cls.stream,
      whatsapp_number: cls.whatsappNumber,
      student_count: 0,
      today_status: "not_marked",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "A class with this level and stream already exists for the active academic year.",
      },
      { status: 409 },
    );
  }
}
