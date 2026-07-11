import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/card";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import { formatDisplayDate } from "@/lib/dates";
import type { AssessmentType } from "@/lib/types/assessment";
import type { StudentProfile } from "@/lib/types/student-profile";

type StudentProfileReportViewProps = {
  profile: StudentProfile;
};

export default function StudentProfileReportView({
  profile,
}: StudentProfileReportViewProps) {
  const { student, class: cls, summary, attendance, assessments } = profile;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-semibold text-slate-900">{student.full_name}</p>
        <p className="mt-1 text-sm text-slate-600">
          Roll {student.roll_no}
          {student.admission_no ? ` · Admission ${student.admission_no}` : ""}
          {" · "}
          {cls.display_name}
        </p>
        {student.parent_phone && (
          <p className="mt-1 text-sm text-slate-600">Parent phone: {student.parent_phone}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={`Attendance (${attendance.month})`}
          value={`${attendance.attendance_percentage}%`}
        />
        <StatCard label="Present days" value={attendance.present_days} />
        <StatCard label="Absent days" value={attendance.absent_days} />
        <StatCard
          label="Average marks"
          value={
            summary.average_marks_percentage !== null
              ? `${summary.average_marks_percentage}%`
              : "—"
          }
        />
      </div>

      {summary.latest_assessment && (
        <p className="text-sm text-slate-700">
          Latest assessment: {summary.latest_assessment.assessment_name} (
          {summary.latest_assessment.marks_obtained ?? "—"} /{" "}
          {summary.latest_assessment.max_marks})
        </p>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Assessment History
        </h3>
        {assessments.length === 0 ? (
          <p className="text-sm text-slate-600">No assessment records for this student.</p>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Assessment</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Subject</TableHeaderCell>
                <TableHeaderCell>Marks</TableHeaderCell>
                <TableHeaderCell>%</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {assessments.map((entry) => (
                <TableRow key={entry.assessment_id}>
                  <TableCell>
                    {formatDisplayDate(new Date(entry.assessment_date + "T00:00:00Z"))}
                  </TableCell>
                  <TableCell>{entry.assessment_name}</TableCell>
                  <TableCell>
                    {ASSESSMENT_TYPE_LABELS[entry.assessment_type as AssessmentType]}
                  </TableCell>
                  <TableCell>{entry.subject_name}</TableCell>
                  <TableCell>
                    {entry.marks_obtained !== null
                      ? `${entry.marks_obtained} / ${entry.max_marks}`
                      : "Absent"}
                  </TableCell>
                  <TableCell>
                    {entry.percentage !== null ? `${entry.percentage}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
