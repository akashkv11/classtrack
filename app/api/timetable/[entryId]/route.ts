import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  buildTimetableUpdateData,
  getTimetableEntryById,
  getTimetableEntries,
  serializeTimetableEntry,
  summaryFromWriteInput,
} from "@/lib/queries/timetable";
import { findOverlappingEntries } from "@/lib/timetable";
import {
  parseInput,
  timetableEntryCreateSchema,
  timetableEntryUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;
  const entry = await getTimetableEntryById(entryId);

  if (!entry) {
    return NextResponse.json({ error: "Timetable entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { entryId } = await context.params;
  const existing = await getTimetableEntryById(entryId);

  if (!existing) {
    return NextResponse.json({ error: "Timetable entry not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = parseInput(timetableEntryUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  if (parsed.data.class_id) {
    const cls = await prisma.class.findUnique({
      where: { id: parsed.data.class_id },
      select: { id: true, isActive: true },
    });
    if (!cls || !cls.isActive) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
  }

  const { data, merged } = buildTimetableUpdateData(existing, parsed.data);
  const scheduleValidation = parseInput(timetableEntryCreateSchema, {
    class_id: merged.class_id,
    subject: merged.subject,
    schedule_type: merged.schedule_type,
    entry_date: merged.entry_date ?? undefined,
    repeat_days: merged.repeat_days,
    schedule_exceptions: merged.schedule_exceptions,
    repeat_start: merged.repeat_start ?? undefined,
    repeat_end: merged.repeat_end ?? undefined,
    start_time: merged.start_time,
    end_time: merged.end_time,
    notes: merged.notes ?? undefined,
  });

  if (!scheduleValidation.success) {
    return NextResponse.json(validationErrorResponse(scheduleValidation), {
      status: 400,
    });
  }

  const cls = await prisma.class.findUnique({
    where: { id: merged.class_id },
    select: { displayName: true },
  });

  const draft = summaryFromWriteInput(
    cls?.displayName ?? existing.class_name,
    {
      class_id: merged.class_id,
      subject: merged.subject,
      schedule_type: merged.schedule_type,
      entry_date: merged.entry_date ?? undefined,
      repeat_days: merged.repeat_days,
      schedule_exceptions: merged.schedule_exceptions,
      repeat_start: merged.repeat_start ?? undefined,
      repeat_end: merged.repeat_end ?? undefined,
      start_time: merged.start_time,
      end_time: merged.end_time,
      notes: merged.notes ?? undefined,
    },
    entryId,
  );
  draft.is_active = parsed.data.is_active ?? existing.is_active;

  const allEntries = await getTimetableEntries({ activeOnly: true });
  const overlaps =
    draft.is_active ? findOverlappingEntries(draft, allEntries, entryId) : [];

  try {
    const updated = await prisma.timetableEntry.update({
      where: { id: entryId },
      data,
      include: { class: { select: { displayName: true } } },
    });

    return NextResponse.json({
      entry: serializeTimetableEntry(updated),
      overlaps,
    });
  } catch {
    return NextResponse.json({ error: "Timetable entry not found" }, { status: 404 });
  }
}
