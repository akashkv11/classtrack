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
  syllabusChapterCreateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ subjectId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
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
  const parsed = parseInput(syllabusChapterCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const maxOrder = await prisma.syllabusChapter.aggregate({
    where: { syllabusSubjectId: subjectId },
    _max: { displayOrder: true },
  });

  const chapter = await prisma.syllabusChapter.create({
    data: {
      syllabusSubjectId: subjectId,
      chapterNumber: parsed.data.chapter_number ?? null,
      chapterTitle: parsed.data.chapter_title,
      chapterSummary: parsed.data.chapter_summary ?? null,
      displayOrder:
        parsed.data.display_order ?? (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({
    success: true,
    chapter: {
      id: chapter.id,
      chapter_number: chapter.chapterNumber,
      chapter_title: chapter.chapterTitle,
      chapter_summary: chapter.chapterSummary,
      display_order: chapter.displayOrder,
    },
  });
}
