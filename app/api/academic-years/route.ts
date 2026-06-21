import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import {
  academicYearSchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const parsed = parseInput(academicYearSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const { name, start_date, end_date, set_active } = parsed.data;
  const startDate = parseISODate(start_date);
  const endDate = parseISODate(end_date);
  const setActive = set_active !== false;

  const existingCount = await prisma.academicYear.count();
  const shouldActivate = setActive || existingCount === 0;

  try {
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
  } catch {
    return NextResponse.json(
      { error: "An academic year with this name already exists" },
      { status: 409 },
    );
  }
}
