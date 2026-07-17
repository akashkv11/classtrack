import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate, formatISODate } from "@/lib/dates";
import { serializeSubtopicsCoveredForDb } from "@/lib/syllabus/subtopics";
import type { DiaryStatus } from "@/lib/types/teaching-diary";
import {
  applySyllabusStatusUpdateToTopics,
  findTeachingDiaryDuplicate,
  getTeachingDiaryEntryById,
  replaceTeachingDiaryTopics,
} from "@/lib/queries/teaching-diary";
import {
  classOwnershipMismatchResponse,
  getEntryClassId,
  validateSyllabusTopicsHierarchy,
  verifyClassOwnership,
} from "@/lib/teaching-diary/access";
import { parseRequiredClassIdQuery } from "@/lib/teaching-diary/api-helpers";
import {
  parseInput,
  teachingDiaryUpdateSchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ entryId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { entryId } = await context.params;
  const entryClassId = await getEntryClassId(entryId);

  if (!entryClassId) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(entryClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const entry = await getTeachingDiaryEntryById(entryId);
  return NextResponse.json({ entry });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { entryId } = await context.params;
  const entryClassId = await getEntryClassId(entryId);

  if (!entryClassId) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(entryClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  const body = await request.json();
  const parsed = parseInput(teachingDiaryUpdateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const existing = await prisma.teachingDiaryEntry.findUnique({
    where: { id: entryId },
    include: {
      topics: { select: { syllabusTopicId: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const subjectId =
    parsed.data.syllabus_subject_id !== undefined
      ? parsed.data.syllabus_subject_id
      : existing.syllabusSubjectId;
  const chapterId =
    parsed.data.syllabus_chapter_id !== undefined
      ? parsed.data.syllabus_chapter_id
      : existing.syllabusChapterId;
  const existingTopicIds =
    existing.topics.length > 0
      ? existing.topics.map((link) => link.syllabusTopicId)
      : existing.syllabusTopicId
        ? [existing.syllabusTopicId]
        : [];
  const topicIds =
    parsed.data.syllabus_topic_ids !== undefined
      ? parsed.data.syllabus_topic_ids
      : existingTopicIds;

  const hierarchyCheck = await validateSyllabusTopicsHierarchy(
    classIdResult.classId,
    subjectId,
    chapterId,
    topicIds,
  );

  if (!hierarchyCheck.ok) {
    return NextResponse.json({ error: hierarchyCheck.error }, { status: 400 });
  }

  const entryDate =
    parsed.data.entry_date !== undefined
      ? parsed.data.entry_date
      : formatISODate(existing.entryDate);
  const diaryStatus = (
    parsed.data.diary_status !== undefined
      ? parsed.data.diary_status
      : existing.diaryStatus
  ) as DiaryStatus;

  const duplicateError = await findTeachingDiaryDuplicate({
    classId: classIdResult.classId,
    entryDate,
    syllabusTopicIds: topicIds,
    timetableEntryId: existing.timetableEntryId,
    diaryStatus,
    excludeEntryId: entryId,
  });

  if (duplicateError) {
    return NextResponse.json({ error: duplicateError }, { status: 409 });
  }

  await prisma.teachingDiaryEntry.update({
    where: { id: entryId },
    data: {
      ...(parsed.data.entry_date !== undefined && {
        entryDate: parseISODate(parsed.data.entry_date),
      }),
      ...(parsed.data.syllabus_subject_id !== undefined && {
        syllabusSubjectId: parsed.data.syllabus_subject_id,
      }),
      ...(parsed.data.syllabus_chapter_id !== undefined && {
        syllabusChapterId: parsed.data.syllabus_chapter_id,
      }),
      ...(parsed.data.syllabus_topic_ids !== undefined && {
        syllabusTopicId: parsed.data.syllabus_topic_id ?? null,
      }),
      ...(parsed.data.topic_taught !== undefined && {
        topicTaught: parsed.data.topic_taught,
      }),
      ...(parsed.data.subtopics_covered !== undefined && {
        subtopicsCovered: serializeSubtopicsCoveredForDb(
          parsed.data.subtopics_covered,
        ),
      }),
      ...(parsed.data.teaching_notes !== undefined && {
        teachingNotes: parsed.data.teaching_notes,
      }),
      ...(parsed.data.examples_covered !== undefined && {
        examplesCovered: parsed.data.examples_covered,
      }),
      ...(parsed.data.student_response !== undefined && {
        studentResponse: parsed.data.student_response,
      }),
      ...(parsed.data.next_class_plan !== undefined && {
        nextClassPlan: parsed.data.next_class_plan,
      }),
      ...(parsed.data.diary_status !== undefined && {
        diaryStatus: parsed.data.diary_status,
      }),
      ...(parsed.data.syllabus_status_update !== undefined && {
        syllabusStatusUpdate: parsed.data.syllabus_status_update,
      }),
      ...(parsed.data.remarks !== undefined && { remarks: parsed.data.remarks }),
    },
  });

  if (parsed.data.syllabus_topic_ids !== undefined) {
    await replaceTeachingDiaryTopics(entryId, topicIds);
  }

  const statusUpdate = parsed.data.syllabus_status_update;
  if (topicIds.length > 0 && statusUpdate && statusUpdate !== "KEEP_CURRENT") {
    await applySyllabusStatusUpdateToTopics(topicIds, statusUpdate);
  }

  const freshEntry = await getTeachingDiaryEntryById(entryId);

  return NextResponse.json({
    success: true,
    entry: freshEntry,
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const classIdResult = parseRequiredClassIdQuery(request);
  if (!classIdResult.ok) return classIdResult.response;

  const { entryId } = await context.params;
  const entryClassId = await getEntryClassId(entryId);

  if (!entryClassId) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (!verifyClassOwnership(entryClassId, classIdResult.classId)) {
    return classOwnershipMismatchResponse();
  }

  await prisma.teachingDiaryEntry.delete({ where: { id: entryId } });

  return NextResponse.json({ success: true });
}
