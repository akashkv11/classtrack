import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import { serializeSubtopicsCoveredForDb } from "@/lib/syllabus/subtopics";
import {
  applySyllabusStatusUpdate,
  computeDiarySummary,
  findTeachingDiaryDuplicate,
  getTaughtSyllabusTopicIds,
  getTeachingDiaryEntriesForClass,
  getTeachingDiaryEntryById,
  mapEntryToJson,
} from "@/lib/queries/teaching-diary";
import { validateSyllabusHierarchy } from "@/lib/teaching-diary/access";
import { validateTimetableEntryForClass } from "@/lib/timetable/access";
import {
  parseInput,
  teachingDiaryCreateSchema,
  teachingDiaryListQuerySchema,
  validationErrorResponse,
} from "@/lib/validation";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseInput(teachingDiaryListQuerySchema, queryParams);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const entries = await getTeachingDiaryEntriesForClass(classId, {
    subjectId: parsed.data.subject_id,
    chapterId: parsed.data.chapter_id,
    topicId: parsed.data.topic_id,
    dateFrom: parsed.data.date_from,
    dateTo: parsed.data.date_to,
    status: parsed.data.status,
  });

  const taughtTopicIds = await getTaughtSyllabusTopicIds(classId);

  return NextResponse.json({
    class_id: classId,
    entries,
    summary: computeDiarySummary(entries),
    taught_topic_ids: taughtTopicIds,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(teachingDiaryCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const hierarchyCheck = await validateSyllabusHierarchy(
    classId,
    parsed.data.syllabus_subject_id,
    parsed.data.syllabus_chapter_id,
    parsed.data.syllabus_topic_id,
  );

  if (!hierarchyCheck.ok) {
    return NextResponse.json({ error: hierarchyCheck.error }, { status: 400 });
  }

  if (parsed.data.timetable_entry_id) {
    const timetableCheck = await validateTimetableEntryForClass(
      classId,
      parsed.data.timetable_entry_id,
    );
    if (!timetableCheck.ok) {
      return NextResponse.json({ error: timetableCheck.error }, { status: 400 });
    }
  }

  const duplicateError = await findTeachingDiaryDuplicate({
    classId,
    entryDate: parsed.data.entry_date,
    syllabusTopicId: parsed.data.syllabus_topic_id ?? null,
    timetableEntryId: parsed.data.timetable_entry_id ?? null,
    diaryStatus: parsed.data.diary_status,
  });

  if (duplicateError) {
    return NextResponse.json({ error: duplicateError }, { status: 409 });
  }

  const entry = await prisma.teachingDiaryEntry.create({
    data: {
      classId,
      timetableEntryId: parsed.data.timetable_entry_id ?? null,
      syllabusSubjectId: parsed.data.syllabus_subject_id ?? null,
      syllabusChapterId: parsed.data.syllabus_chapter_id ?? null,
      syllabusTopicId: parsed.data.syllabus_topic_id ?? null,
      entryDate: parseISODate(parsed.data.entry_date),
      topicTaught: parsed.data.topic_taught,
      subtopicsCovered: serializeSubtopicsCoveredForDb(
        parsed.data.subtopics_covered ?? [],
      ),
      teachingNotes: parsed.data.teaching_notes ?? null,
      examplesCovered: parsed.data.examples_covered ?? null,
      studentResponse: parsed.data.student_response,
      nextClassPlan: parsed.data.next_class_plan ?? null,
      diaryStatus: parsed.data.diary_status,
      syllabusStatusUpdate: parsed.data.syllabus_status_update,
      remarks: parsed.data.remarks ?? null,
    },
    include: {
      syllabusSubject: { select: { id: true, subjectName: true } },
      syllabusChapter: {
        select: { id: true, chapterNumber: true, chapterTitle: true },
      },
      syllabusTopic: { select: { id: true, topicTitle: true, status: true } },
    },
  });

  if (
    parsed.data.syllabus_topic_id &&
    parsed.data.syllabus_status_update &&
    parsed.data.syllabus_status_update !== "KEEP_CURRENT"
  ) {
    await applySyllabusStatusUpdate(
      parsed.data.syllabus_topic_id,
      parsed.data.syllabus_status_update,
    );
  }

  const freshEntry = await getTeachingDiaryEntryById(entry.id);

  return NextResponse.json({
    success: true,
    entry: freshEntry ?? mapEntryToJson(entry),
  });
}
