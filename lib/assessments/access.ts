import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSyllabusHierarchy } from "@/lib/teaching-diary/access";

export async function getAssessmentClassId(assessmentId: string): Promise<string | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { classId: true },
  });
  return assessment?.classId ?? null;
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

export async function validateAssessmentSyllabus(
  classId: string,
  subjectId: string,
  chapterId: string | null | undefined,
  topicIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hierarchyCheck = await validateSyllabusHierarchy(
    classId,
    subjectId,
    chapterId,
    topicIds.length === 1 ? topicIds[0] : null,
  );

  if (!hierarchyCheck.ok) {
    return hierarchyCheck;
  }

  if (topicIds.length === 0) {
    return { ok: true };
  }

  for (const topicId of topicIds) {
    const topic = await prisma.syllabusTopic.findUnique({
      where: { id: topicId },
      include: {
        syllabusChapter: {
          include: { syllabusSubject: true },
        },
      },
    });

    if (!topic) {
      return { ok: false, error: "Syllabus topic not found" };
    }

    if (topic.syllabusChapter.syllabusSubject.classId !== classId) {
      return { ok: false, error: "Syllabus topic does not belong to this class" };
    }

    if (chapterId && topic.syllabusChapterId !== chapterId) {
      return { ok: false, error: "Topic does not belong to the selected chapter" };
    }

    if (topic.syllabusChapter.syllabusSubjectId !== subjectId) {
      return { ok: false, error: "Topic does not belong to the selected subject" };
    }
  }

  return { ok: true };
}
