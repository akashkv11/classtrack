import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import { formatISODate } from "@/lib/dates";
import { roundMark, toMarkNumber } from "@/lib/assessments/marks";
import type { AssessmentSharingState, AssessmentType, ParentAssessmentInfo, ParentAssessmentResult } from "@/lib/types/assessment";

export const RESULT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const resultResponseHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
type Database = Pick<Prisma.TransactionClient, "assessment" | "assessmentMark">;
export type SharingAction = "enable" | "disable" | "regenerate";

export function normalizeStudentName(name: string) {
  return name.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-IN");
}

export function assessmentSharingState(assessment: { shareToken: string | null; sharingEnabled: boolean }, hasSavedMarks: boolean): AssessmentSharingState {
  return { path: assessment.shareToken ? `/results/${assessment.shareToken}` : null, enabled: assessment.sharingEnabled, has_saved_marks: hasSavedMarks };
}

// Conditional update makes the first publication atomic even with concurrent saves.
// A disabled link retains its token, so saving marks never republishes it.
export async function publishAssessmentOnFirstSave(tx: Database, assessmentId: string) {
  await tx.assessment.updateMany({
    where: { id: assessmentId, shareToken: null },
    data: { shareToken: randomBytes(32).toString("base64url"), sharingEnabled: true },
  });
}

export async function changeAssessmentSharing(assessmentId: string, classId: string, action: SharingAction) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM assessments WHERE id = ${assessmentId}::uuid FOR UPDATE`;
    const assessment = await tx.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment || assessment.classId !== classId) return { error: "Assessment not found.", status: 404 } as const;
    const count = await tx.assessmentMark.count({ where: { assessmentId } });
    if (!count && action !== "disable") return { error: "Save marks before generating a parent link.", status: 400 } as const;
    const saved = await tx.assessment.update({
      where: { id: assessmentId },
      data: action === "disable" ? { sharingEnabled: false } : {
        sharingEnabled: true,
        shareToken: action === "regenerate" || !assessment.shareToken ? randomBytes(32).toString("base64url") : assessment.shareToken,
      },
    });
    return { sharing: assessmentSharingState(saved, count > 0) } as const;
  });
}

const parentAssessmentSelect = {
  name: true, assessmentType: true, assessmentDate: true, maxMarks: true,
  class: { select: { displayName: true } },
  syllabusSubject: { select: { subjectName: true } },
  syllabusChapter: { select: { chapterTitle: true } },
  topics: { select: { syllabusTopic: { select: { topicTitle: true } } } },
} as const;
type ParentAssessmentRow = Prisma.AssessmentGetPayload<{ select: typeof parentAssessmentSelect }>;
function parentAssessmentInfo(row: ParentAssessmentRow): ParentAssessmentInfo {
  return {
    name: row.name, assessment_type: row.assessmentType as AssessmentType,
    assessment_date: formatISODate(row.assessmentDate), max_marks: toMarkNumber(row.maxMarks) ?? 0,
    class_name: row.class.displayName, subject: row.syllabusSubject.subjectName,
    chapter: row.syllabusChapter?.chapterTitle ?? null,
    topics: row.topics.map(topic => topic.syllabusTopic.topicTitle),
  };
}

export async function getParentAssessment(token: string, db: Database = prisma) {
  if (!RESULT_TOKEN_PATTERN.test(token)) return null;
  const row = await db.assessment.findUnique({ where: { shareToken: token, sharingEnabled: true }, select: parentAssessmentSelect });
  return row ? parentAssessmentInfo(row) : null;
}

export async function lookupParentResult(token: string, name: string, rollNo?: number, db: Database = prisma): Promise<
  { status: "unavailable" | "not_found" | "roll_required" } | { status: "found"; result: ParentAssessmentResult }
> {
  if (!RESULT_TOKEN_PATTERN.test(token)) return { status: "unavailable" };
  const assessment = await db.assessment.findUnique({
    where: { shareToken: token, sharingEnabled: true },
    select: { ...parentAssessmentSelect, id: true, classId: true },
  });
  if (!assessment) return { status: "unavailable" };
  // Only saved rows are eligible. Inactive students retain access to saved results.
  const records = await db.assessmentMark.findMany({
    where: { assessmentId: assessment.id, student: { classId: assessment.classId } },
    select: { marksObtained: true, remarks: true, student: { select: { fullName: true, rollNo: true } } },
  });
  const matches = records.filter(record => normalizeStudentName(record.student.fullName) === normalizeStudentName(name));
  if (matches.length > 1 && rollNo === undefined) return { status: "roll_required" };
  const match = matches.find(record => rollNo === undefined || record.student.rollNo === rollNo);
  if (!match) return { status: "not_found" };
  // Recheck after lookup so a concurrent disable/regeneration cannot serve a stale link.
  const stillEnabled = await db.assessment.count({ where: { id: assessment.id, shareToken: token, sharingEnabled: true } });
  if (!stillEnabled) return { status: "unavailable" };
  const info = parentAssessmentInfo(assessment);
  const marks = toMarkNumber(match.marksObtained);
  return { status: "found", result: {
    assessment: info, student_name: match.student.fullName, roll_no: match.student.rollNo,
    marks_obtained: marks, percentage: marks === null ? null : roundMark(marks / info.max_marks * 100), remarks: match.remarks,
  } };
}
