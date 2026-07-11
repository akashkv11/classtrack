import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getMonthlyAcademicWorkReport } from "@/lib/queries/reports";
import {
  parseInput,
  reportMonthQuerySchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseInput(reportMonthQuerySchema, queryParams);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const report = await getMonthlyAcademicWorkReport(
    classId,
    parsed.data.month,
    parsed.data.subject_id,
  );

  if (!report) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
