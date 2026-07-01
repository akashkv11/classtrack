import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  classOwnershipMismatchResponse,
  getChapterClassId,
  verifyClassOwnership,
} from "@/lib/syllabus/access";
import { parseRequiredClassIdQuery } from "@/lib/syllabus/api-helpers";
import { serializeSubtopicsForDb } from "@/lib/queries/syllabus";
import {
  parseInput,
  syllabusTopicCreateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ chapterId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
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
  const parsed = parseInput(syllabusTopicCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const maxOrder = await prisma.syllabusTopic.aggregate({
    where: { syllabusChapterId: chapterId },
    _max: { displayOrder: true },
  });

  const topic = await prisma.syllabusTopic.create({
    data: {
      syllabusChapterId: chapterId,
      topicTitle: parsed.data.topic_title,
      subtopics: serializeSubtopicsForDb(parsed.data.subtopics),
      priority: parsed.data.priority,
      estimatedClasses: parsed.data.estimated_classes ?? null,
      targetDate: parsed.data.target_date
        ? new Date(parsed.data.target_date)
        : null,
      remarks: parsed.data.remarks ?? null,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({
    success: true,
    topic: {
      id: topic.id,
      topic_title: topic.topicTitle,
      status: topic.status,
      priority: topic.priority,
    },
  });
}
