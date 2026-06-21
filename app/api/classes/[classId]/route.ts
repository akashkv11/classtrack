import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { todayISO } from "@/lib/dates";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      academicYear: true,
      _count: { select: { students: { where: { isActive: true } } } },
      attendanceSessions: {
        orderBy: { attendanceDate: "desc" },
        take: 10,
      },
    },
  });

  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const today = todayISO();
  const todaySession = cls.attendanceSessions.find(
    (s) => s.attendanceDate.toISOString().slice(0, 10) === today,
  );

  return NextResponse.json({
    id: cls.id,
    display_name: cls.displayName,
    level: cls.level,
    stream: cls.stream,
    academic_year: cls.academicYear.name,
    whatsapp_number: cls.whatsappNumber,
    student_count: cls._count.students,
    is_active: cls.isActive,
    today_status: todaySession ? "marked" : "not_marked",
    recent_dates: cls.attendanceSessions.map((s) =>
      s.attendanceDate.toISOString().slice(0, 10),
    ),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();

  const data: {
    displayName?: string;
    whatsappNumber?: string | null;
    isActive?: boolean;
  } = {};

  if (typeof body.display_name === "string") {
    data.displayName = body.display_name.trim();
  }
  if (body.whatsapp_number !== undefined) {
    const num =
      typeof body.whatsapp_number === "string"
        ? body.whatsapp_number.replace(/\D/g, "")
        : "";
    data.whatsappNumber = num || null;
  }
  if (typeof body.is_active === "boolean") {
    data.isActive = body.is_active;
  }

  await prisma.class.update({
    where: { id: classId },
    data,
  });

  return NextResponse.json({ success: true });
}
