import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function getEntryClassId(entryId: string): Promise<string | null> {
  const entry = await prisma.teachingDiaryEntry.findUnique({
    where: { id: entryId },
    select: { classId: true },
  });
  return entry?.classId ?? null;
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

export async function validateSyllabusHierarchy(
  classId: string,
  subjectId: string | null | undefined,
  chapterId: string | null | undefined,
  topicId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return validateSyllabusTopicsHierarchy(
    classId,
    subjectId,
    chapterId,
    topicId ? [topicId] : [],
  );
}

export async function validateSyllabusTopicsHierarchy(
  classId: string,
  subjectId: string | null | undefined,
  chapterId: string | null | undefined,
  topicIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const uniqueTopicIds = [...new Set(topicIds.filter(Boolean))];

  if (uniqueTopicIds.length > 0) {
    const topics = await prisma.syllabusTopic.findMany({
      where: { id: { in: uniqueTopicIds } },
      include: {
        syllabusChapter: {
          include: { syllabusSubject: true },
        },
      },
    });

    if (topics.length !== uniqueTopicIds.length) {
      return { ok: false, error: "One or more syllabus topics were not found" };
    }

    for (const topic of topics) {
      if (topic.syllabusChapter.syllabusSubject.classId !== classId) {
        return { ok: false, error: "Syllabus topic does not belong to this class" };
      }

      if (chapterId && topic.syllabusChapterId !== chapterId) {
        return { ok: false, error: "Chapter does not match the selected topic" };
      }

      if (subjectId && topic.syllabusChapter.syllabusSubjectId !== subjectId) {
        return { ok: false, error: "Subject does not match the selected topic" };
      }
    }

    return { ok: true };
  }

  if (chapterId) {
    const chapter = await prisma.syllabusChapter.findUnique({
      where: { id: chapterId },
      include: { syllabusSubject: true },
    });

    if (!chapter) {
      return { ok: false, error: "Syllabus chapter not found" };
    }

    if (chapter.syllabusSubject.classId !== classId) {
      return { ok: false, error: "Syllabus chapter does not belong to this class" };
    }

    if (subjectId && chapter.syllabusSubjectId !== subjectId) {
      return { ok: false, error: "Subject does not match the selected chapter" };
    }

    return { ok: true };
  }

  if (subjectId) {
    const subject = await prisma.syllabusSubject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return { ok: false, error: "Syllabus subject not found" };
    }

    if (subject.classId !== classId) {
      return { ok: false, error: "Syllabus subject does not belong to this class" };
    }
  }

  return { ok: true };
}
