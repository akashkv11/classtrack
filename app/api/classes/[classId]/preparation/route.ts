import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseISODate } from "@/lib/dates";
import { getPreparationRoster } from "@/lib/queries/preparation";
import { preparationSaveSchema, preparationSlotSchema } from "@/lib/validation/preparation-schemas";

type Context = { params: Promise<{ classId: string }> };

async function validSlot(classId: string, timetableEntryId: string | null) {
  if (timetableEntryId) {
    return !!await prisma.timetableEntry.findFirst({ where: { id: timetableEntryId, classId }, select: { id: true } });
  }
  return !!await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
}

export async function GET(request: NextRequest, context: Context) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();
  const { classId } = await context.params;
  const parsed = preparationSlotSchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    timetable_entry_id: request.nextUrl.searchParams.get("timetable_entry_id"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid preparation date or period" }, { status: 400 });
  const timetableEntryId = parsed.data.timetable_entry_id ?? null;
  if (!await validSlot(classId, timetableEntryId)) return NextResponse.json({ error: "Class or period not found" }, { status: 404 });
  return NextResponse.json(await getPreparationRoster(classId, parsed.data.date, timetableEntryId));
}

export async function PUT(request: NextRequest, context: Context) {
  if (!(await isRequestAuthenticated(request))) return unauthorizedResponse();
  const { classId } = await context.params;
  const parsed = preparationSaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid preparation records" }, { status: 400 });
  const { date, records, timetable_entry_id } = parsed.data;
  const timetableEntryId = timetable_entry_id ?? null;
  if (!await validSlot(classId, timetableEntryId)) return NextResponse.json({ error: "Class or period not found" }, { status: 404 });

  const saved = await prisma.$transaction(async (tx) => {
    const students = await tx.student.findMany({
      where: { classId, id: { in: records.map((record) => record.student_id) } }, select: { id: true },
    });
    if (students.length !== records.length) return false;
    for (const record of records) {
      // Raw upsert supports the NULLS NOT DISTINCT slot index for classes without timetable periods.
      await tx.$executeRaw`
        INSERT INTO student_preparations (id, class_id, student_id, preparation_date, timetable_entry_id, status, updated_at)
        VALUES (gen_random_uuid(), ${classId}::uuid, ${record.student_id}::uuid,
          ${parseISODate(date)}::date, ${timetableEntryId}::uuid, ${record.preparation_status}, CURRENT_TIMESTAMP)
        ON CONFLICT (class_id, preparation_date, timetable_entry_id, student_id)
        DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
      `;
    }
    return true;
  });
  if (!saved) return NextResponse.json({ error: "Selected students must belong to this class" }, { status: 400 });
  return NextResponse.json({ success: true });
}
