import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { todayISO } from "@/lib/dates";

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
        where: { attendanceDate: new Date(today) },
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
