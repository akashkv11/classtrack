import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { getAttendanceAlertsForClass } from "@/lib/queries/attendance-alerts";
import {
  attendanceAlertsListQuerySchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const searchParams = request.nextUrl.searchParams;

  const parsed = parseInput(attendanceAlertsListQuerySchema, {
    month: searchParams.get("month") ?? "",
    alert_type: searchParams.get("alert_type") ?? "ALL",
    status: searchParams.get("status") ?? "OPEN",
  });

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const result = await getAttendanceAlertsForClass(classId, parsed.data.month, {
    alertType: parsed.data.alert_type,
    status: parsed.data.status,
  });

  if (!result) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
