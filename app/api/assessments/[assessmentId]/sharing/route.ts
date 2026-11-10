import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { classOwnershipMismatchResponse, getAssessmentClassId, verifyClassOwnership } from "@/lib/assessments/access";
import { parseRequiredClassIdQuery } from "@/lib/assessments/api-helpers";
import { changeAssessmentSharing } from "@/lib/assessments/sharing";

const schema = z.object({ action: z.enum(["enable", "disable", "regenerate"]) });
export async function POST(request: NextRequest, context: { params: Promise<{ assessmentId: string }> }) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();
  const parsedClass = parseRequiredClassIdQuery(request);
  if (!parsedClass.ok) return parsedClass.response;
  const { assessmentId } = await context.params;
  if (!z.uuid().safeParse(assessmentId).success) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  const classId = await getAssessmentClassId(assessmentId);
  if (!classId) return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  if (!verifyClassOwnership(classId, parsedClass.classId)) return classOwnershipMismatchResponse();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid link action." }, { status: 400 });
  const result = await changeAssessmentSharing(assessmentId, parsedClass.classId, parsed.data.action);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
