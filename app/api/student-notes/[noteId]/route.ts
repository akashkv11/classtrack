import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  getStudentNoteById,
  mapNoteToJson,
  parseNoteDates,
} from "@/lib/queries/student-notes";
import {
  classOwnershipMismatchResponse,
  getNoteClassId,
  verifyClassOwnership,
} from "@/lib/student-notes/access";
import { parseRequiredClassIdQuery } from "@/lib/student-notes/api-helpers";
import {
  parseInput,
  studentNoteUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ noteId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { noteId } = await context.params;
  const noteClassId = await getNoteClassId(noteId);

  if (!noteClassId) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(noteClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const note = await getStudentNoteById(noteId);
  return NextResponse.json({ note });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { noteId } = await context.params;
  const noteClassId = await getNoteClassId(noteId);

  if (!noteClassId) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(noteClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(studentNoteUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const existing = await prisma.studentNote.findUnique({
    where: { id: noteId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const followUpNeeded =
    parsed.data.follow_up_needed !== undefined
      ? parsed.data.follow_up_needed
      : existing.followUpNeeded;

  const followUpDateRaw =
    parsed.data.follow_up_date !== undefined
      ? parsed.data.follow_up_date
      : existing.followUpDate
        ? existing.followUpDate.toISOString().slice(0, 10)
        : null;

  if (followUpNeeded && !followUpDateRaw) {
    return NextResponse.json(
      {
        error: "Follow-up date is required when follow-up is needed",
        field_errors: { follow_up_date: "Follow-up date is required" },
      },
      { status: 400 },
    );
  }

  const noteDateInput =
    parsed.data.note_date ??
    existing.noteDate.toISOString().slice(0, 10);
  const dates = parseNoteDates({
    note_date: noteDateInput,
    follow_up_date: followUpNeeded ? followUpDateRaw : null,
  });

  const note = await prisma.studentNote.update({
    where: { id: noteId },
    data: {
      ...(parsed.data.note_date !== undefined && { noteDate: dates.noteDate }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.note_text !== undefined && { noteText: parsed.data.note_text }),
      ...(parsed.data.follow_up_needed !== undefined && {
        followUpNeeded: parsed.data.follow_up_needed,
      }),
      ...(parsed.data.follow_up_needed !== undefined ||
      parsed.data.follow_up_date !== undefined
        ? { followUpDate: followUpNeeded ? dates.followUpDate : null }
        : {}),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    },
  });

  const freshNote = await getStudentNoteById(note.id);

  return NextResponse.json({
    success: true,
    note: freshNote ?? mapNoteToJson(note),
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { noteId } = await context.params;
  const noteClassId = await getNoteClassId(noteId);

  if (!noteClassId) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(noteClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.studentNote.delete({ where: { id: noteId } });

  return NextResponse.json({ success: true });
}
