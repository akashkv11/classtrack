import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import type { AssessmentSummary } from "@/lib/types/assessment";

type AssessmentCardProps = {
  classId: string;
  assessment: AssessmentSummary;
  onEdit?: (assessment: AssessmentSummary) => void;
  onDelete?: (assessment: AssessmentSummary) => void;
};

export default function AssessmentCard({
  classId,
  assessment,
  onEdit,
  onDelete,
}: AssessmentCardProps) {
  const marksProgress =
    assessment.student_count > 0
      ? `${assessment.marks_entered_count}/${assessment.student_count} marks entered`
      : "No students";

  return (
    <Card className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/classes/${classId}/assessments/${assessment.id}`}
            className="text-lg font-semibold text-slate-900 hover:text-blue-700"
          >
            {assessment.name}
          </Link>
          <p className="mt-1 text-sm text-slate-600">
            {formatDisplayDate(new Date(assessment.assessment_date + "T00:00:00Z"))}
            {" · "}
            {assessment.subject.name}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Max marks: {assessment.max_marks}
            {assessment.class_average !== null &&
              ` · Class avg: ${assessment.class_average}/${assessment.max_marks}`}
          </p>
          {assessment.topics.length > 0 && (
            <p className="mt-1 text-sm text-slate-600">
              Topics: {assessment.topics.map((t) => t.topic_title).join(", ")}
            </p>
          )}
          <p className="mt-1 text-sm text-slate-500">{marksProgress}</p>
        </div>
        <Badge variant="info">
          {ASSESSMENT_TYPE_LABELS[assessment.assessment_type]}
        </Badge>
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(assessment)}
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(assessment)}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
