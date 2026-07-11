import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

export function classOwnershipMismatchResponse() {
  return NextResponse.json(
    { error: "Resource does not belong to this class" },
    { status: 403 },
  );
}
