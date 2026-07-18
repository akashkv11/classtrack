import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getStudentMonthlyAttendance } from "@/lib/queries/student-profile";
import { monthSchema, parseInput, uuidSchema, validationErrorResponse } from "@/lib/validation";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ classId: string; studentId: string }>;
};

const querySchema = z.object({
  month: monthSchema,
});

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId, studentId } = await context.params;

  if (!uuidSchema.safeParse(classId).success || !uuidSchema.safeParse(studentId).success) {
    return NextResponse.json({ error: "Invalid student or class id" }, { status: 400 });
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseInput(querySchema, query);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const attendance = await getStudentMonthlyAttendance(
    classId,
    studentId,
    parsed.data.month,
  );

  if (!attendance) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(attendance);
}
