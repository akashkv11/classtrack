import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getSyllabusSubjectDetail } from "@/lib/queries/syllabus";

type RouteContext = { params: Promise<{ classId: string; subjectId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId, subjectId } = await context.params;
  const subject = await getSyllabusSubjectDetail(subjectId);

  if (!subject || subject.class_id !== classId) {
    return NextResponse.json({ error: "Syllabus subject not found" }, { status: 404 });
  }

  return NextResponse.json(subject);
}
