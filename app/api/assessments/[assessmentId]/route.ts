import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import { getAssessmentById } from "@/lib/queries/assessments";
import {
  classOwnershipMismatchResponse,
  getAssessmentClassId,
  validateAssessmentSyllabus,
  verifyClassOwnership,
} from "@/lib/assessments/access";
import { parseRequiredClassIdQuery } from "@/lib/assessments/api-helpers";
import {
  assessmentUpdateSchema,
  parseInput,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ assessmentId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { assessmentId } = await context.params;
  const assessmentClassId = await getAssessmentClassId(assessmentId);

  if (!assessmentClassId) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(assessmentClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const assessment = await getAssessmentById(assessmentId);
  return NextResponse.json({ assessment });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { assessmentId } = await context.params;
  const assessmentClassId = await getAssessmentClassId(assessmentId);

  if (!assessmentClassId) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(assessmentClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(assessmentUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const existing = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { topics: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const subjectId =
    parsed.data.syllabus_subject_id !== undefined
      ? parsed.data.syllabus_subject_id
      : existing.syllabusSubjectId;
  const chapterId =
    parsed.data.syllabus_chapter_id !== undefined
      ? parsed.data.syllabus_chapter_id
      : existing.syllabusChapterId;
  const topicIds =
    parsed.data.syllabus_topic_ids !== undefined
      ? parsed.data.syllabus_topic_ids
      : existing.topics.map((t) => t.syllabusTopicId);

  const syllabusCheck = await validateAssessmentSyllabus(
    classIdResult.classId,
    subjectId,
    chapterId,
    topicIds,
  );

  if (!syllabusCheck.ok) {
    return NextResponse.json({ error: syllabusCheck.error }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.assessment.update({
      where: { id: assessmentId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.syllabus_subject_id !== undefined && {
          syllabusSubjectId: parsed.data.syllabus_subject_id,
        }),
        ...(parsed.data.syllabus_chapter_id !== undefined && {
          syllabusChapterId: parsed.data.syllabus_chapter_id,
        }),
        ...(parsed.data.assessment_type !== undefined && {
          assessmentType: parsed.data.assessment_type,
        }),
        ...(parsed.data.assessment_date !== undefined && {
          assessmentDate: parseISODate(parsed.data.assessment_date),
        }),
        ...(parsed.data.max_marks !== undefined && {
          maxMarks: parsed.data.max_marks,
        }),
        ...(parsed.data.remarks !== undefined && {
          remarks: parsed.data.remarks,
        }),
      },
    });

    if (parsed.data.syllabus_topic_ids !== undefined) {
      await tx.assessmentTopic.deleteMany({ where: { assessmentId } });
      if (topicIds.length > 0) {
        await tx.assessmentTopic.createMany({
          data: topicIds.map((topicId) => ({
            assessmentId,
            syllabusTopicId: topicId,
          })),
        });
      }
    }
  });

  const assessment = await getAssessmentById(assessmentId);

  return NextResponse.json({
    success: true,
    assessment,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { assessmentId } = await context.params;
  const assessmentClassId = await getAssessmentClassId(assessmentId);

  if (!assessmentClassId) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(assessmentClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.assessment.delete({ where: { id: assessmentId } });

  return NextResponse.json({ success: true });
}
