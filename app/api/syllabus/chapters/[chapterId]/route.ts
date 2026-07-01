import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  classOwnershipMismatchResponse,
  getChapterClassId,
  verifyClassOwnership,
} from "@/lib/syllabus/access";
import { parseRequiredClassIdQuery } from "@/lib/syllabus/api-helpers";
import { getSyllabusChapterDetail } from "@/lib/queries/syllabus";
import {
  parseInput,
  syllabusChapterUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ chapterId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { chapterId } = await context.params;
  const chapter = await getSyllabusChapterDetail(chapterId);

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(chapter.class_id, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  return NextResponse.json(chapter);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { chapterId } = await context.params;
  const chapterClassId = await getChapterClassId(chapterId);

  if (!chapterClassId) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(chapterClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(syllabusChapterUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const chapter = await prisma.syllabusChapter.update({
    where: { id: chapterId },
    data: {
      chapterNumber: parsed.data.chapter_number,
      chapterTitle: parsed.data.chapter_title,
      chapterSummary: parsed.data.chapter_summary,
      displayOrder: parsed.data.display_order,
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { chapterId } = await context.params;
  const chapterClassId = await getChapterClassId(chapterId);

  if (!chapterClassId) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(chapterClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.syllabusChapter.delete({ where: { id: chapterId } });

  return NextResponse.json({ success: true });
}
