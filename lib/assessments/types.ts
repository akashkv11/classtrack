import type { AssessmentType } from "@/lib/types/assessment";

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  CLASS_TEST: "Class Test",
  UNIT_TEST: "Unit Test",
  MODEL_EXAM: "Model Exam",
  PRACTICAL: "Practical",
  REVISION_TEST: "Revision Test",
  ASSIGNMENT: "Assignment",
  OTHER: "Other",
};

export const ASSESSMENT_TYPES = Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[];

export function isAssessmentType(value: string): value is AssessmentType {
  return value in ASSESSMENT_TYPE_LABELS;
}
