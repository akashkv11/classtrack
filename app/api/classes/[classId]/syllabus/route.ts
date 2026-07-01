import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  findExistingSubjectByName,
  getSyllabusSubjectsForClass,
} from "@/lib/queries/syllabus";
import {
  parseInput,
  syllabusSubjectCreateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const subjects = await getSyllabusSubjectsForClass(classId);

  return NextResponse.json({
    class_id: classId,
    subjects,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(syllabusSubjectCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const existing = await findExistingSubjectByName(
    classId,
    parsed.data.subject_name,
  );
  if (existing) {
    return NextResponse.json(
      {
        error: `A syllabus already exists for ${parsed.data.subject_name}`,
        existing_subject: existing,
      },
      { status: 409 },
    );
  }

  const subject = await prisma.syllabusSubject.create({
    data: {
      classId,
      subjectName: parsed.data.subject_name,
      stream: parsed.data.stream ?? null,
      textbookName: parsed.data.textbook_name ?? null,
      board: parsed.data.board ?? null,
      academicYear: parsed.data.academic_year ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    subject: {
      id: subject.id,
      subject_name: subject.subjectName,
    },
  });
}
