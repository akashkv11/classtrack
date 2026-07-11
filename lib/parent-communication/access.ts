import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function getCommunicationClassId(
  communicationId: string,
): Promise<string | null> {
  const record = await prisma.parentCommunication.findUnique({
    where: { id: communicationId },
    select: { classId: true },
  });
  return record?.classId ?? null;
}

export function classOwnershipMismatchResponse() {
  return NextResponse.json(
    { error: "Resource does not belong to this class" },
    { status: 403 },
  );
}

export function verifyClassOwnership(
  resourceClassId: string | null,
  expectedClassId: string,
): boolean {
  return resourceClassId === expectedClassId;
}

export async function verifyStudentInClass(
  classId: string,
  studentId: string,
): Promise<boolean> {
  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
    select: { id: true },
  });
  return student !== null;
}

export async function verifyStudentNoteLink(
  classId: string,
  studentId: string,
  studentNoteId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!studentNoteId) return { ok: true };

  const note = await prisma.studentNote.findFirst({
    where: { id: studentNoteId, classId, studentId },
    select: { id: true },
  });

  if (!note) {
    return { ok: false, error: "Linked student note not found for this student" };
  }

  return { ok: true };
}
