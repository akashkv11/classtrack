import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  getParentCommunicationById,
  mapCommunicationToJson,
  parseCommunicationDates,
} from "@/lib/queries/parent-communications";
import {
  classOwnershipMismatchResponse,
  getCommunicationClassId,
  verifyClassOwnership,
  verifyStudentNoteLink,
} from "@/lib/parent-communication/access";
import { parseRequiredClassIdQuery } from "@/lib/parent-communication/api-helpers";
import {
  parseInput,
  parentCommunicationUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ communicationId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { communicationId } = await context.params;
  const communicationClassId = await getCommunicationClassId(communicationId);

  if (!communicationClassId) {
    return NextResponse.json({ error: "Communication not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(communicationClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const communication = await getParentCommunicationById(communicationId);
  return NextResponse.json({ communication });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { communicationId } = await context.params;
  const communicationClassId = await getCommunicationClassId(communicationId);

  if (!communicationClassId) {
    return NextResponse.json({ error: "Communication not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(communicationClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(parentCommunicationUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const existing = await prisma.parentCommunication.findUnique({
    where: { id: communicationId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Communication not found" }, { status: 404 });
  }

  const studentNoteId =
    parsed.data.student_note_id !== undefined
      ? parsed.data.student_note_id
      : existing.studentNoteId;

  const noteCheck = await verifyStudentNoteLink(
    classIdResult.classId,
    existing.studentId,
    studentNoteId,
  );
  if (!noteCheck.ok) {
    return NextResponse.json({ error: noteCheck.error }, { status: 400 });
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

  const communicationDateInput =
    parsed.data.communication_date ??
    existing.communicationDate.toISOString().slice(0, 10);
  const dates = parseCommunicationDates({
    communication_date: communicationDateInput,
    follow_up_date: followUpNeeded ? followUpDateRaw : null,
  });

  const record = await prisma.parentCommunication.update({
    where: { id: communicationId },
    data: {
      ...(parsed.data.communication_date !== undefined && {
        communicationDate: dates.communicationDate,
      }),
      ...(parsed.data.communication_type !== undefined && {
        communicationType: parsed.data.communication_type,
      }),
      ...(parsed.data.reason !== undefined && { reason: parsed.data.reason }),
      ...(parsed.data.summary !== undefined && { summary: parsed.data.summary }),
      ...(parsed.data.student_note_id !== undefined && {
        studentNoteId: parsed.data.student_note_id,
      }),
      ...(parsed.data.follow_up_needed !== undefined && {
        followUpNeeded: parsed.data.follow_up_needed,
      }),
      ...(parsed.data.follow_up_needed !== undefined ||
      parsed.data.follow_up_date !== undefined
        ? { followUpDate: followUpNeeded ? dates.followUpDate : null }
        : {}),
      ...(parsed.data.status !== undefined && { status: parsed.data.status }),
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { communicationId } = await context.params;
  const communicationClassId = await getCommunicationClassId(communicationId);

  if (!communicationClassId) {
    return NextResponse.json({ error: "Communication not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(communicationClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.parentCommunication.delete({ where: { id: communicationId } });

  return NextResponse.json({ success: true });
}
