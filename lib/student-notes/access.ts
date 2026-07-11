import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function getNoteClassId(noteId: string): Promise<string | null> {
  const note = await prisma.studentNote.findUnique({
    where: { id: noteId },
    select: { classId: true },
  });
  return note?.classId ?? null;
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
