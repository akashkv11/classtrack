import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  classOwnershipMismatchResponse,
  getTopicClassId,
  verifyClassOwnership,
} from "@/lib/syllabus/access";
import { parseRequiredClassIdQuery } from "@/lib/syllabus/api-helpers";
import { mapTopicToJson, serializeSubtopicsForDb } from "@/lib/queries/syllabus";
import {
  parseInput,
  syllabusTopicUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ topicId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { topicId } = await context.params;
  const topicClassId = await getTopicClassId(topicId);

  if (!topicClassId) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(topicClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(syllabusTopicUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const topic = await prisma.syllabusTopic.update({
    where: { id: topicId },
    data: {
      topicTitle: parsed.data.topic_title,
      subtopics: parsed.data.subtopics
        ? serializeSubtopicsForDb(parsed.data.subtopics)
        : undefined,
      priority: parsed.data.priority,
      estimatedClasses: parsed.data.estimated_classes,
      targetDate:
        parsed.data.target_date === undefined
          ? undefined
          : parsed.data.target_date
            ? new Date(parsed.data.target_date)
            : null,
      remarks: parsed.data.remarks,
    },
  });

  return NextResponse.json({
    success: true,
    topic: mapTopicToJson(topic),
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { topicId } = await context.params;
  const topicClassId = await getTopicClassId(topicId);

  if (!topicClassId) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(topicClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.syllabusTopic.delete({ where: { id: topicId } });

  return NextResponse.json({ success: true });
}
