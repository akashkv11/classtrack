import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getStudentProfileReports } from "@/lib/queries/student-profile-report";
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
  const query = Object.fromEntries(request.nextUrl.searchParams);

  const parsed = parseInput(reportStudentProfileQuerySchema, query);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const profiles = await getStudentProfileReports(classId, parsed.data.student_id);
  if (!profiles || (!profiles.length && parsed.data.student_id)) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ profiles });
}
