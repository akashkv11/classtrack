import type { AssessmentResultSummary } from "@/lib/types/assessment";

type MarkInput = {
  marksObtained: number | null;
};

export function computeAssessmentSummary(
  marks: MarkInput[],
  maxMarks: number,
  totalStudents: number,
  lowMarksPercent = 40,
): AssessmentResultSummary {
  const withMarks = marks.filter((m) => m.marksObtained !== null);
  const absentCount = marks.filter((m) => m.marksObtained === null).length;
  const obtainedValues = withMarks.map((m) => m.marksObtained as number);

  const threshold = maxMarks * (lowMarksPercent / 100);
  const belowThresholdCount = obtainedValues.filter((v) => v < threshold).length;

  let classAverage: number | null = null;
  let highest: number | null = null;
  let lowest: number | null = null;

  if (obtainedValues.length > 0) {
    const sum = obtainedValues.reduce((a, b) => a + b, 0);
    classAverage = Math.round((sum / obtainedValues.length) * 10) / 10;
    highest = Math.max(...obtainedValues);
    lowest = Math.min(...obtainedValues);
  }

  return {
    class_average: classAverage,
    highest,
    lowest,
    below_40_percent_count: belowThresholdCount,
    absent_count: absentCount,
    entered_count: withMarks.length,
    total_students: totalStudents,
  };
}
