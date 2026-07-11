import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  getParentCommunicationById,
  getParentCommunications,
  mapCommunicationToJson,
  parseCommunicationDates,
} from "@/lib/queries/parent-communications";
import {
  verifyStudentInClass,
  verifyStudentNoteLink,
} from "@/lib/parent-communication/access";
import {
  parseInput,
  parentCommunicationCreateSchema,
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

  const communications = await getParentCommunications(classId, studentId);

  return NextResponse.json({
    class_id: classId,
    student_id: studentId,
    communications,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId, studentId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(parentCommunicationCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const studentOk = await verifyStudentInClass(classId, studentId);
  if (!studentOk) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const noteCheck = await verifyStudentNoteLink(
    classId,
    studentId,
    parsed.data.student_note_id,
  );
  if (!noteCheck.ok) {
    return NextResponse.json({ error: noteCheck.error }, { status: 400 });
  }

  const dates = parseCommunicationDates(parsed.data);

  const record = await prisma.parentCommunication.create({
    data: {
      classId,
      studentId,
      studentNoteId: parsed.data.student_note_id ?? null,
      communicationDate: dates.communicationDate,
      communicationType: parsed.data.communication_type,
      reason: parsed.data.reason,
      summary: parsed.data.summary,
      followUpNeeded: parsed.data.follow_up_needed,
      followUpDate: parsed.data.follow_up_needed ? dates.followUpDate : null,
      status: parsed.data.status,
    },
    include: {
      studentNote: {
        select: {
          id: true,
          noteDate: true,
          category: true,
          noteText: true,
        },
      },
    },
  });

  const fresh = await getParentCommunicationById(record.id);

  return NextResponse.json({
    success: true,
    communication: fresh ?? mapCommunicationToJson(record),
  });
}
