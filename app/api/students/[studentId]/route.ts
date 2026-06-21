import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  parseInput,
  studentUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ studentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { studentId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(studentUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const data: {
    rollNo?: number;
    fullName?: string;
    admissionNo?: string | null;
    parentPhone?: string | null;
    isActive?: boolean;
  } = {};

  if (parsed.data.roll_no !== undefined) {
    data.rollNo = parsed.data.roll_no;
  }
  if (parsed.data.full_name !== undefined) {
    data.fullName = parsed.data.full_name;
  }
  if (parsed.data.admission_no !== undefined) {
    data.admissionNo = parsed.data.admission_no;
  }
  if (parsed.data.parent_phone !== undefined) {
    data.parentPhone = parsed.data.parent_phone;
  }
  if (parsed.data.is_active !== undefined) {
    data.isActive = parsed.data.is_active;
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
