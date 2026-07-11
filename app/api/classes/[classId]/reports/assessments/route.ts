import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getAssessmentsReport } from "@/lib/queries/reports";
import {
  parseInput,
  reportAssessmentsQuerySchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const month = request.nextUrl.searchParams.get("month") ?? undefined;

  const parsed = parseInput(reportAssessmentsQuerySchema, { month });
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const report = await getAssessmentsReport(classId, parsed.data.month);
  if (!report) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
