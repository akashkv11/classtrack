import { prisma } from "@/lib/db";

export async function getSubjectClassId(subjectId: string): Promise<string | null> {
  const subject = await prisma.syllabusSubject.findUnique({
    where: { id: subjectId },
    select: { classId: true },
  });
  return subject?.classId ?? null;
}

export async function getChapterClassId(chapterId: string): Promise<string | null> {
  const chapter = await prisma.syllabusChapter.findUnique({
    where: { id: chapterId },
    select: { syllabusSubject: { select: { classId: true } } },
  });
  return chapter?.syllabusSubject.classId ?? null;
}

export async function getTopicClassId(topicId: string): Promise<string | null> {
  const topic = await prisma.syllabusTopic.findUnique({
    where: { id: topicId },
    select: {
      syllabusChapter: {
        select: { syllabusSubject: { select: { classId: true } } },
      },
    },
  });
  return topic?.syllabusChapter.syllabusSubject.classId ?? null;
}

import { NextResponse } from "next/server";

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
