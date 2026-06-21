import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  getAllSettings,
  setSetting,
  SETTING_LATE_COUNTS_AS_PRESENT,
  SETTING_MESSAGE_SIGNATURE,
} from "@/lib/settings";
import {
  parseInput,
  settingsPatchSchema,
  validationErrorResponse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const academicYears = await prisma.academicYear.findMany({
    orderBy: { startDate: "desc" },
  });

  const settings = await getAllSettings();

  return NextResponse.json({
    academic_years: academicYears.map((y) => ({
      id: y.id,
      name: y.name,
      is_active: y.isActive,
    })),
    settings: {
      message_signature: settings[SETTING_MESSAGE_SIGNATURE],
      late_counts_as_present: settings[SETTING_LATE_COUNTS_AS_PRESENT] !== "false",
    },
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const parsed = parseInput(settingsPatchSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const { active_academic_year_id, message_signature, late_counts_as_present } =
    parsed.data;

  if (active_academic_year_id) {
    const year = await prisma.academicYear.findUnique({
      where: { id: active_academic_year_id },
    });

    if (!year) {
      return NextResponse.json(
        { error: "Selected academic year does not exist", field_errors: { active_academic_year_id: "Selected academic year does not exist" } },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.academicYear.updateMany({ data: { isActive: false } }),
      prisma.academicYear.update({
        where: { id: active_academic_year_id },
        data: { isActive: true },
      }),
    ]);
  }

  if (message_signature !== undefined) {
    await setSetting(SETTING_MESSAGE_SIGNATURE, message_signature);
  }

  if (late_counts_as_present !== undefined) {
    await setSetting(
      SETTING_LATE_COUNTS_AS_PRESENT,
      late_counts_as_present ? "true" : "false",
    );
  }

  return NextResponse.json({ success: true });
}
