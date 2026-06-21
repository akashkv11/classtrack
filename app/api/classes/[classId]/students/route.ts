import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";

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

  const rollNo = Number(body.roll_no);
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const admissionNo =
    typeof body.admission_no === "string" && body.admission_no.trim()
      ? body.admission_no.trim()
      : null;
  const parentPhone =
    typeof body.parent_phone === "string" && body.parent_phone.trim()
      ? body.parent_phone.trim()
      : null;

  if (!fullName || !Number.isInteger(rollNo) || rollNo < 1) {
    return NextResponse.json({ error: "Invalid student data" }, { status: 400 });
  }

  try {
    const student = await prisma.student.create({
      data: {
        classId,
        rollNo,
        fullName,
        admissionNo,
        parentPhone,
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        roll_no: student.rollNo,
        full_name: student.fullName,
        admission_no: student.admissionNo,
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
