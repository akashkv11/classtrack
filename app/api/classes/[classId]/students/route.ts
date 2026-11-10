import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { createStudentWithAssignedNumbers } from "@/lib/queries/student-admissions";
import {
  parseInput,
  studentCreateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { rollNo: "asc" },
  });

  return NextResponse.json(
    students.map((s) => ({
      id: s.id,
      roll_no: s.rollNo,
      full_name: s.fullName,
      admission_no: s.admissionNo,
      email: s.email,
      parent_phone: s.parentPhone,
      is_active: s.isActive,
    })),
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(studentCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const { full_name, email, parent_phone, is_active } = parsed.data;

  try {
    const student = await createStudentWithAssignedNumbers(classId, {
      fullName: full_name,
      email,
      parentPhone: parent_phone,
      isActive: is_active,
    });
    if (!student) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        roll_no: student.rollNo,
        full_name: student.fullName,
        admission_no: student.admissionNo,
        email: student.email,
        is_active: student.isActive,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Roll number or admission number already exists" },
      { status: 409 },
    );
  }
}
