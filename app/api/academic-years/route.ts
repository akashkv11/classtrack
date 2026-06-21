import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";

export async function POST(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const startDateStr =
    typeof body.start_date === "string" ? body.start_date.trim() : "";
  const endDateStr = typeof body.end_date === "string" ? body.end_date.trim() : "";
  const setActive = body.set_active !== false;

  if (!name || !startDateStr || !endDateStr) {
    return NextResponse.json(
      { error: "name, start_date, and end_date are required" },
      { status: 400 },
    );
  }

  const startDate = parseISODate(startDateStr);
  const endDate = parseISODate(endDateStr);

  if (endDate < startDate) {
    return NextResponse.json(
      { error: "end_date must be on or after start_date" },
      { status: 400 },
    );
  }

  const existingCount = await prisma.academicYear.count();
  const shouldActivate = setActive || existingCount === 0;

  const year = await prisma.$transaction(async (tx) => {
    if (shouldActivate) {
      await tx.academicYear.updateMany({ data: { isActive: false } });
    }

    return tx.academicYear.create({
      data: {
        name,
        startDate,
        endDate,
        isActive: shouldActivate,
      },
    });
  });

  return NextResponse.json({
    id: year.id,
    name: year.name,
    is_active: year.isActive,
  });
}
