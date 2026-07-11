import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getStudentProfile } from "@/lib/queries/student-profile";
import {
  parseInput,
  reportStudentProfileQuerySchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const studentId = request.nextUrl.searchParams.get("student_id") ?? "";

  const parsed = parseInput(reportStudentProfileQuerySchema, { student_id: studentId });
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const profile = await getStudentProfile(classId, parsed.data.student_id);
  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
