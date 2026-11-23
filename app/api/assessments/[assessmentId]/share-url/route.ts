import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseRequiredClassIdQuery } from "@/lib/assessments/api-helpers";
import { classOwnershipMismatchResponse } from "@/lib/assessments/access";
import { assessmentSharingState } from "@/lib/assessments/sharing";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest, context: { params: Promise<{ assessmentId: string }> }) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();
  const parsedClass = parseRequiredClassIdQuery(request);
  if (!parsedClass.ok) return parsedClass.response;
  const { assessmentId } = await context.params;
  if (!z.uuid().safeParse(assessmentId).success) return NextResponse.json({ error: "Assessment not found." }, { status: 404, headers });
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { classId: true, shareToken: true, sharingEnabled: true },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment not found." }, { status: 404, headers });
  if (assessment.classId !== parsedClass.classId) return classOwnershipMismatchResponse();
  const { path } = assessmentSharingState(assessment, true);
  if (!assessment.sharingEnabled || !path) return NextResponse.json({ error: "Enable the parent results link before sharing." }, { status: 409, headers });

  // The destination is derived from this assessment and site, never a client-supplied URL.
  const target = new URL(path, request.url).href;
  return NextResponse.json({ path, url: target, shortened: false }, { headers });
}
