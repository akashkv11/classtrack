import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import {
  applySyllabusStatusUpdate,
  getTeachingDiaryEntryById,
  mapEntryToJson,
} from "@/lib/queries/teaching-diary";
import {
  classOwnershipMismatchResponse,
  getEntryClassId,
  validateSyllabusHierarchy,
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
  const topicId =
    parsed.data.syllabus_topic_id !== undefined
      ? parsed.data.syllabus_topic_id
      : existing.syllabusTopicId;

  const hierarchyCheck = await validateSyllabusHierarchy(
    classIdResult.classId,
    subjectId,
    chapterId,
    topicId,
  );

  if (!hierarchyCheck.ok) {
    return NextResponse.json({ error: hierarchyCheck.error }, { status: 400 });
  }

  const entry = await prisma.teachingDiaryEntry.update({
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
      ...(parsed.data.syllabus_topic_id !== undefined && {
        syllabusTopicId: parsed.data.syllabus_topic_id,
      }),
      ...(parsed.data.topic_taught !== undefined && {
        topicTaught: parsed.data.topic_taught,
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
      ...(parsed.data.homework_given !== undefined && {
        homeworkGiven: parsed.data.homework_given,
      }),
      ...(parsed.data.homework_note !== undefined && {
        homeworkNote: parsed.data.homework_note,
      }),
      ...(parsed.data.diary_status !== undefined && {
        diaryStatus: parsed.data.diary_status,
      }),
      ...(parsed.data.syllabus_status_update !== undefined && {
        syllabusStatusUpdate: parsed.data.syllabus_status_update,
      }),
      ...(parsed.data.remarks !== undefined && { remarks: parsed.data.remarks }),
    },
    include: {
      syllabusSubject: { select: { id: true, subjectName: true } },
      syllabusChapter: {
        select: { id: true, chapterNumber: true, chapterTitle: true },
      },
      syllabusTopic: { select: { id: true, topicTitle: true, status: true } },
    },
  });

  const statusUpdate = parsed.data.syllabus_status_update;
  const effectiveTopicId = entry.syllabusTopicId;

  if (effectiveTopicId && statusUpdate && statusUpdate !== "KEEP_CURRENT") {
    await applySyllabusStatusUpdate(effectiveTopicId, statusUpdate);
  }

  const freshEntry = await getTeachingDiaryEntryById(entryId);

  return NextResponse.json({
    success: true,
    entry: freshEntry ?? mapEntryToJson(entry),
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
