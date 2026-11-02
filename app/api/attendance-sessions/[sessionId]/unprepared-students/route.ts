import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

const selectionSchema = z.object({
  student_ids: z.array(z.string().uuid()).max(1000).refine(
    (ids) => new Set(ids).size === ids.length,
    "Select each student only once",
  ),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();

  const parsed = selectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid student selection" }, { status: 400 });
  }

  const { sessionId } = await context.params;
  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      select: { records: { select: { studentId: true } } },
    });
    if (!session) return { error: "Session not found", status: 404 };

    const studentIds = new Set(session.records.map((record) => record.studentId));
    if (parsed.data.student_ids.some((id) => !studentIds.has(id))) {
      return { error: "Selected students must belong to this session", status: 400 };
    }

    await tx.attendanceRecord.updateMany({
      where: { sessionId, isUnprepared: true },
      data: { isUnprepared: false },
    });
    if (parsed.data.student_ids.length > 0) {
      await tx.attendanceRecord.updateMany({
        where: { sessionId, studentId: { in: parsed.data.student_ids } },
        data: { isUnprepared: true },
      });
    }
    return null;
  });

  if (result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true });
}
