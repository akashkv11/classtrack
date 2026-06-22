import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { buildAbsenteeMessage, buildWhatsAppUrl, subjectForStream } from "@/lib/whatsapp";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { sessionId } = await context.params;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      records: {
        include: { student: true },
        orderBy: { student: { rollNo: "asc" } },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.class.whatsappNumber) {
    return NextResponse.json(
      { error: "WhatsApp number not configured for this class" },
      { status: 400 },
    );
  }

  const absentees = session.records
    .filter((r) => r.status === "absent")
    .map((r) => ({ rollNo: r.student.rollNo, fullName: r.student.fullName }));

  const message = buildAbsenteeMessage({
    className: session.class.displayName,
    subject: subjectForStream(session.class.stream),
    date: session.attendanceDate,
    absentees,
  });

  return NextResponse.json({
    phone_number: session.class.whatsappNumber,
    message,
    whatsapp_url: buildWhatsAppUrl(session.class.whatsappNumber, message),
  });
}
