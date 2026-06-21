import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";

type RouteContext = { params: Promise<{ studentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { studentId } = await context.params;
  const body = await request.json();

  const data: {
    rollNo?: number;
    fullName?: string;
    admissionNo?: string | null;
    parentPhone?: string | null;
    isActive?: boolean;
  } = {};

  if (body.roll_no !== undefined) {
    const rollNo = Number(body.roll_no);
    if (!Number.isInteger(rollNo) || rollNo < 1) {
      return NextResponse.json({ error: "Invalid roll number" }, { status: 400 });
    }
    data.rollNo = rollNo;
  }
  if (typeof body.full_name === "string") {
    data.fullName = body.full_name.trim();
  }
  if (body.admission_no !== undefined) {
    data.admissionNo =
      typeof body.admission_no === "string" && body.admission_no.trim()
        ? body.admission_no.trim()
        : null;
  }
  if (body.parent_phone !== undefined) {
    data.parentPhone =
      typeof body.parent_phone === "string" && body.parent_phone.trim()
        ? body.parent_phone.trim()
        : null;
  }
  if (typeof body.is_active === "boolean") {
    data.isActive = body.is_active;
  }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Could not update student" },
      { status: 409 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { studentId } = await context.params;

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
