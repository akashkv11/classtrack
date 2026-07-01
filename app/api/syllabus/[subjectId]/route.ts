import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  classOwnershipMismatchResponse,
  getSubjectClassId,
  verifyClassOwnership,
} from "@/lib/syllabus/access";
import { parseRequiredClassIdQuery } from "@/lib/syllabus/api-helpers";
import {
  parseInput,
  syllabusSubjectUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ subjectId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { subjectId } = await context.params;
  const subjectClassId = await getSubjectClassId(subjectId);

  if (!subjectClassId) {
    return NextResponse.json({ error: "Syllabus subject not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(subjectClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(syllabusSubjectUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const subject = await prisma.syllabusSubject.update({
    where: { id: subjectId },
    data: {
      subjectName: parsed.data.subject_name,
      stream: parsed.data.stream,
      textbookName: parsed.data.textbook_name,
      board: parsed.data.board,
      academicYear: parsed.data.academic_year,
    },
  });

  return NextResponse.json({
    success: true,
    subject: {
      id: subject.id,
      subject_name: subject.subjectName,
      stream: subject.stream,
      textbook_name: subject.textbookName,
      board: subject.board,
      academic_year: subject.academicYear,
    },
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { subjectId } = await context.params;
  const subjectClassId = await getSubjectClassId(subjectId);

  if (!subjectClassId) {
    return NextResponse.json({ error: "Syllabus subject not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(subjectClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.syllabusSubject.delete({ where: { id: subjectId } });

  return NextResponse.json({ success: true });
}
