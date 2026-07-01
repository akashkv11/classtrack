import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import {
  classOwnershipMismatchResponse,
  getTopicClassId,
  verifyClassOwnership,
} from "@/lib/syllabus/access";
import { parseRequiredClassIdQuery } from "@/lib/syllabus/api-helpers";
import { mapTopicToJson } from "@/lib/queries/syllabus";
import { applyStatusDates } from "@/lib/syllabus/status-dates";
import {
  parseInput,
  syllabusTopicStatusSchema,
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
  const parsed = parseInput(syllabusTopicStatusSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const existing = await prisma.syllabusTopic.findUnique({
    where: { id: topicId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const dateUpdates = applyStatusDates(parsed.data.status, existing);

  const topic = await prisma.syllabusTopic.update({
    where: { id: topicId },
    data: {
      status: parsed.data.status,
      ...dateUpdates,
    },
  });

  return NextResponse.json({
    success: true,
    topic: mapTopicToJson(topic),
  });
}
