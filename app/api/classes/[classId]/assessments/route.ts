import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { parseISODate } from "@/lib/dates";
import {
  getAssessmentsForClass,
  getAssessmentById,
  getStudentAssessmentHistory,
} from "@/lib/queries/assessments";
import { validateAssessmentSyllabus } from "@/lib/assessments/access";
import {
  assessmentCreateSchema,
  assessmentListQuerySchema,
  parseInput,
  studentHistoryQuerySchema,
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

  const studentId = request.nextUrl.searchParams.get("student_id");
  if (studentId) {
    const parsed = parseInput(studentHistoryQuerySchema, { student_id: studentId });
    if (!parsed.success) {
      return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
    }

    const history = await getStudentAssessmentHistory(classId, parsed.data.student_id);
    if (!history) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(history);
  }

  const queryParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseInput(assessmentListQuerySchema, queryParams);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const assessments = await getAssessmentsForClass(classId, {
    subjectId: parsed.data.subject_id,
    assessmentType: parsed.data.assessment_type,
    dateFrom: parsed.data.date_from,
    dateTo: parsed.data.date_to,
  });

  return NextResponse.json({
    class_id: classId,
    assessments,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isRequestAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const { classId } = await context.params;
  const body = await request.json();
  const parsed = parseInput(assessmentCreateSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const topicIds = parsed.data.syllabus_topic_ids ?? [];

  const syllabusCheck = await validateAssessmentSyllabus(
    classId,
    parsed.data.syllabus_subject_id,
    parsed.data.syllabus_chapter_id,
    topicIds,
  );

  if (!syllabusCheck.ok) {
    return NextResponse.json({ error: syllabusCheck.error }, { status: 400 });
  }

  const assessment = await prisma.assessment.create({
    data: {
      classId,
      syllabusSubjectId: parsed.data.syllabus_subject_id,
      syllabusChapterId: parsed.data.syllabus_chapter_id ?? null,
      name: parsed.data.name,
      assessmentType: parsed.data.assessment_type,
      assessmentDate: parseISODate(parsed.data.assessment_date),
      maxMarks: parsed.data.max_marks,
      remarks: parsed.data.remarks ?? null,
      topics:
        topicIds.length > 0
          ? {
              create: topicIds.map((topicId) => ({
                syllabusTopicId: topicId,
              })),
            }
          : undefined,
    },
  });

  const detail = await getAssessmentById(assessment.id);

  return NextResponse.json({
    success: true,
    assessment: detail,
  });
}
