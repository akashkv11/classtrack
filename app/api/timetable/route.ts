import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  buildTimetableCreateData,
  getTimetableEntries,
  serializeTimetableEntry,
  summaryFromWriteInput,
} from "@/lib/queries/timetable";
import { findOverlappingEntries } from "@/lib/timetable";
import {
  parseInput,
  timetableEntryCreateSchema,
  validationErrorResponse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { searchParams } = request.nextUrl;
  const classId = searchParams.get("class_id") ?? undefined;
  const subject = searchParams.get("subject") ?? undefined;
  const activeOnly = searchParams.get("active_only") !== "false";

  const entries = await getTimetableEntries({
    activeOnly,
    classId,
    subject,
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const parsed = parseInput(timetableEntryCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const cls = await prisma.class.findUnique({
    where: { id: parsed.data.class_id },
    select: { id: true, displayName: true, isActive: true },
  });

  if (!cls || !cls.isActive) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const draft = summaryFromWriteInput(cls.displayName, parsed.data);

  const existing = await getTimetableEntries({ activeOnly: true });
  const overlaps = findOverlappingEntries(draft, existing);

  const created = await prisma.timetableEntry.create({
    data: buildTimetableCreateData(parsed.data),
    include: { class: { select: { displayName: true } } },
  });

  return NextResponse.json({
    entry: serializeTimetableEntry(created),
    overlaps,
  });
}
