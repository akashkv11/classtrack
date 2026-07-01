import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  buildNormalizedImportData,
  parseSyllabusImportPreview,
} from "@/lib/syllabus/import-parser";
import { findExistingSubjectByName } from "@/lib/queries/syllabus";
import {
  parseInput,
  syllabusImportConfirmSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(syllabusImportConfirmSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const options = {
    importAsNewCopy: parsed.data.options?.importAsNewCopy ?? false,
    importSubtopics: parsed.data.options?.importSubtopics ?? true,
    setInitialStatus: parsed.data.options?.setInitialStatus ?? "NOT_STARTED",
  };
  const preview = parseSyllabusImportPreview(parsed.data.payload);

  if (!preview.valid) {
    return NextResponse.json({ error: preview.error }, { status: 400 });
  }

  const normalized = buildNormalizedImportData(parsed.data.payload, {
    importSubtopics: options.importSubtopics,
    setInitialStatus: options.setInitialStatus,
  });

  const existing = await findExistingSubjectByName(
    classId,
    normalized.subjectName,
  );

  if (existing && !options.importAsNewCopy) {
    return NextResponse.json(
      {
        error: `A syllabus already exists for ${normalized.subjectName}. Choose import as new copy or cancel.`,
        existing_subject: existing,
      },
      { status: 409 },
    );
  }

  const subjectName =
    existing && options.importAsNewCopy
      ? `${normalized.subjectName} (Copy)`
      : normalized.subjectName;

  const result = await prisma.$transaction(async (tx) => {
    const subject = await tx.syllabusSubject.create({
      data: {
        classId,
        subjectName,
        stream: normalized.stream,
        textbookName: normalized.textbookName,
        board: normalized.board,
        academicYear: normalized.academicYear,
        sourceUrl: normalized.sourceUrl,
        importMeta: normalized.importMeta as Prisma.InputJsonValue,
      },
    });

    let topicsCount = 0;
    let subtopicsCount = 0;

    for (const chapter of normalized.chapters) {
      const createdChapter = await tx.syllabusChapter.create({
        data: {
          syllabusSubjectId: subject.id,
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle,
          chapterSummary: chapter.chapterSummary,
          displayOrder: chapter.displayOrder,
          metadata: (chapter.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });

      for (const topic of chapter.topics) {
        await tx.syllabusTopic.create({
          data: {
            syllabusChapterId: createdChapter.id,
            topicTitle: topic.topicTitle,
            subtopics: topic.subtopics.map((st) => ({
              subtopicTitle: st.subtopicTitle,
              nestedSubtopics: st.nestedSubtopics,
            })),
            status: topic.status,
            priority: topic.priority,
            estimatedClasses: topic.estimatedClasses,
            displayOrder: topic.displayOrder,
            needsManualReview: normalized.warnings.length > 0,
          },
        });

        topicsCount += 1;
        subtopicsCount += topic.subtopics.reduce(
          (sum, st) => sum + 1 + st.nestedSubtopics.length,
          0,
        );
      }
    }

    return {
      subjectId: subject.id,
      chaptersCount: normalized.chapters.length,
      topicsCount,
      subtopicsCount,
    };
  });

  return NextResponse.json({
    success: true,
    syllabus_subject_id: result.subjectId,
    imported: {
      chapters: result.chaptersCount,
      topics: result.topicsCount,
      subtopics: result.subtopicsCount,
    },
    warnings:
      normalized.warnings.length > 0
        ? ["Some imported items need manual review.", ...normalized.warnings]
        : [],
  });
}
