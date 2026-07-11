import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  getStudentNotes,
  getStudentNoteById,
  mapNoteToJson,
  parseNoteDates,
} from "@/lib/queries/student-notes";
import { verifyStudentInClass } from "@/lib/student-notes/access";
import {
  parseInput,
  studentNoteCreateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = {
  params: Promise<{ classId: string; studentId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId, studentId } = await context.params;

  const studentOk = await verifyStudentInClass(classId, studentId);
  if (!studentOk) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const notes = await getStudentNotes(classId, studentId);

  return NextResponse.json({
    class_id: classId,
    student_id: studentId,
    notes,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId, studentId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(studentNoteCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const studentOk = await verifyStudentInClass(classId, studentId);
  if (!studentOk) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const dates = parseNoteDates(parsed.data);

  const note = await prisma.studentNote.create({
    data: {
      classId,
      studentId,
      noteDate: dates.noteDate,
      category: parsed.data.category,
      noteText: parsed.data.note_text,
      followUpNeeded: parsed.data.follow_up_needed,
      followUpDate: parsed.data.follow_up_needed ? dates.followUpDate : null,
      status: parsed.data.status,
    },
  });

  const freshNote = await getStudentNoteById(note.id);

  return NextResponse.json({
    success: true,
    note: freshNote ?? mapNoteToJson(note),
  });
}
