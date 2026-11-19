import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseRequiredClassIdQuery } from "@/lib/assessments/api-helpers";
import { classOwnershipMismatchResponse } from "@/lib/assessments/access";
import { assessmentSharingState } from "@/lib/assessments/sharing";
import { canShortenResultsUrl, shortenResultsUrl } from "@/lib/assessments/short-links";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest, context: { params: Promise<{ assessmentId: string }> }) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();
  const parsedClass = parseRequiredClassIdQuery(request);
  if (!parsedClass.ok) return parsedClass.response;
  const { assessmentId } = await context.params;
  if (!z.uuid().safeParse(assessmentId).success) return NextResponse.json({ error: "Assessment not found." }, { status: 404, headers });
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { classId: true, shareToken: true, sharingEnabled: true, shareShortUrl: true, shareShortTarget: true },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment not found." }, { status: 404, headers });
  if (assessment.classId !== parsedClass.classId) return classOwnershipMismatchResponse();
  const { path } = assessmentSharingState(assessment, true);
  if (!assessment.sharingEnabled || !path) return NextResponse.json({ error: "Enable the parent results link before sharing." }, { status: 409, headers });

  // The destination is derived from this assessment and site, never a client-supplied URL.
  const target = new URL(path, request.url).href;
  if (assessment.shareShortTarget === target && assessment.shareShortUrl) {
    return NextResponse.json({ path, url: assessment.shareShortUrl, shortened: true }, { headers });
  }
  if (!canShortenResultsUrl(target)) {
    return NextResponse.json({ path, url: target, shortened: false, warning: "URL shortening is available on the published site. Using the original link." }, { headers });
  }
  try {
    const url = await shortenResultsUrl(target);
    const saved = await prisma.assessment.updateMany({
      where: { id: assessmentId, shareToken: assessment.shareToken, sharingEnabled: true },
      data: { shareShortUrl: url, shareShortTarget: target },
    });
    if (!saved.count) return NextResponse.json({ error: "The parent link changed. Please try again." }, { status: 409, headers });
    return NextResponse.json({ path, url, shortened: true }, { headers });
  } catch {
    return NextResponse.json({ path, url: target, shortened: false, warning: "Could not shorten the link. Using the original link instead." }, { headers });
  }
}
