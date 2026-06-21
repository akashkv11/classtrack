import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  getAllSettings,
  setSetting,
  SETTING_LATE_COUNTS_AS_PRESENT,
  SETTING_MESSAGE_SIGNATURE,
} from "@/lib/settings";

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

  if (typeof body.active_academic_year_id === "string") {
    await prisma.$transaction([
      prisma.academicYear.updateMany({ data: { isActive: false } }),
      prisma.academicYear.update({
        where: { id: body.active_academic_year_id },
        data: { isActive: true },
      }),
    ]);
  }

  if (typeof body.message_signature === "string") {
    await setSetting(SETTING_MESSAGE_SIGNATURE, body.message_signature.trim());
  }

  if (typeof body.late_counts_as_present === "boolean") {
    await setSetting(
      SETTING_LATE_COUNTS_AS_PRESENT,
      body.late_counts_as_present ? "true" : "false",
    );
  }

  return NextResponse.json({ success: true });
}
