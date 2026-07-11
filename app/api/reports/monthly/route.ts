import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getMonthlyAttendanceReport } from "@/lib/queries/reports";
import {
  monthQuerySchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const parsed = parseInput(monthQuerySchema, {
    class_id: request.nextUrl.searchParams.get("class_id") ?? "",
    month: request.nextUrl.searchParams.get("month") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const report = await getMonthlyAttendanceReport(
    parsed.data.class_id,
    parsed.data.month,
  );

  if (!report) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
