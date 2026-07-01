import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseSyllabusImportPreview } from "@/lib/syllabus/import-parser";
import { findExistingSubjectByName } from "@/lib/queries/syllabus";
import {
  parseInput,
  syllabusImportPreviewSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(syllabusImportPreviewSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const detectedSubject =
    parsed.data.json.basic_information?.subject_name ??
    parsed.data.json.app_ready_syllabus?.subject ??
    null;

  let existingSubject = null;
  if (detectedSubject) {
    existingSubject = await findExistingSubjectByName(classId, detectedSubject);
  }

  const preview = parseSyllabusImportPreview(parsed.data.json, existingSubject);

  if (!preview.valid) {
    return NextResponse.json(
      { error: preview.error, ...preview, valid: false },
      { status: 400 },
    );
  }

  return NextResponse.json({
    valid: true,
    detected: {
      class_grade: preview.detected.classGrade,
      stream: preview.detected.stream,
      subject: preview.detected.subject,
      textbook_name: preview.detected.textbookName,
      board: preview.detected.board,
    },
    counts: {
      chapters: preview.counts.chapters,
      topics: preview.counts.topics,
      subtopics: preview.counts.subtopics,
    },
    warnings: preview.warnings,
    chapters: preview.chapters.map((ch) => ({
      chapter_number: ch.chapterNumber,
      chapter_title: ch.chapterTitle,
      topics_count: ch.topicsCount,
      subtopics_count: ch.subtopicsCount,
    })),
    existing_subject: preview.existingSubject,
  });
}
