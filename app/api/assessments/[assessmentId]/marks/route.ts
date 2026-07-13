import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRequestAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { toMarkNumber } from "@/lib/assessments/marks";
import {
  classOwnershipMismatchResponse,
  getAssessmentClassId,
  verifyClassOwnership,
} from "@/lib/assessments/access";
import { parseRequiredClassIdQuery } from "@/lib/assessments/api-helpers";
import { getAssessmentMarksGrid } from "@/lib/queries/assessments";
import {
  assessmentMarksSaveSchema,
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

  const data = await getAssessmentMarksGrid(assessmentId, classIdResult.classId);
  if (!data) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = parseInput(assessmentMarksSaveSchema, body);

  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed), { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: { classId: classIdResult.classId, isActive: true },
  });
  const studentIds = new Set(students.map((s) => s.id));

  const validatedRecords: {
    studentId: string;
    marksObtained: number | null;
    remarks: string | null;
  }[] = [];

  const maxMarks = toMarkNumber(assessment.maxMarks) ?? 0;

  for (const record of parsed.data.records) {
    if (!studentIds.has(record.student_id)) continue;

    if (
      record.marks_obtained !== null &&
      record.marks_obtained > maxMarks
    ) {
      return NextResponse.json(
        {
          error: `Marks cannot exceed max marks (${maxMarks})`,
        },
        { status: 400 },
      );
    }

    validatedRecords.push({
      studentId: record.student_id,
      marksObtained: record.marks_obtained,
      remarks: record.remarks ?? null,
    });
  }

  if (validatedRecords.length !== students.length) {
    return NextResponse.json(
      { error: "All active students must have a mark record" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const record of validatedRecords) {
      await tx.assessmentMark.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId,
            studentId: record.studentId,
          },
        },
        create: {
          assessmentId,
          studentId: record.studentId,
          marksObtained: record.marksObtained,
          remarks: record.remarks,
        },
        update: {
          marksObtained: record.marksObtained,
          remarks: record.remarks,
        },
      });
    }
  });

  const data = await getAssessmentMarksGrid(assessmentId, classIdResult.classId);

  return NextResponse.json({
    success: true,
    ...data,
  });
}
