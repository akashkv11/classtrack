import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { verifyStudentInClass } from "@/lib/attendance-alerts/access";
import {
  getAttendanceAlertsForClass,
  upsertAttendanceAlertStatus,
} from "@/lib/queries/attendance-alerts";
import {
  attendanceAlertStatusUpdateSchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(attendanceAlertStatusUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const studentInClass = await verifyStudentInClass(classId, parsed.data.student_id);
  if (!studentInClass) {
    return NextResponse.json({ error: "Student not found in this class" }, { status: 404 });
  }

  const currentAlerts = await getAttendanceAlertsForClass(classId, parsed.data.month, {
    status: "ALL",
  });

  if (!currentAlerts) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const alert = currentAlerts.alerts.find(
    (item) => item.alert_key === parsed.data.alert_key,
  );

  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await upsertAttendanceAlertStatus({
    classId,
    studentId: parsed.data.student_id,
    alertKey: parsed.data.alert_key,
    alertType: parsed.data.alert_type,
    month: parsed.data.month,
    status: parsed.data.status,
  });

  const refreshed = await getAttendanceAlertsForClass(classId, parsed.data.month, {
    status: "ALL",
  });

  const updated =
    refreshed?.alerts.find((item) => item.alert_key === parsed.data.alert_key) ?? {
      ...alert,
      status: parsed.data.status,
    };

  return NextResponse.json({
    success: true,
    alert: updated,
  });
}
