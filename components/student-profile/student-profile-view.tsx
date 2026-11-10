import Link from "next/link";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import { StatCard } from "@/components/ui/card";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { ButtonLink } from "@/components/ui/button";
import StudentAttendanceSection from "@/components/student-profile/student-attendance-section";
import EditStudentButton from "@/components/student-profile/edit-student-button";
import ParentPhoneLink from "@/components/students/parent-phone-link";
import { formatDisplayDate } from "@/lib/dates";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import type { StudentProfile } from "@/lib/types/student-profile";

type StudentProfileViewProps = {
  profile: StudentProfile;
};

export default function StudentProfileView({ profile }: StudentProfileViewProps) {
  const { student, class: cls, summary, attendance, overall_attendance: overallAttendance, assessments } = profile;

  return (
    <>
      <Card className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{student.full_name}</h2>
            <p className="mt-1 text-sm text-slate-600">{cls.display_name}</p>
            <p className="mt-1 text-sm text-slate-600">Roll No: {student.roll_no}</p>
            {student.admission_no && (
              <p className="mt-1 text-sm text-slate-600">
                Admission No: {student.admission_no}
              </p>
            )}
            {student.email && (
              <p className="mt-1 text-sm text-slate-600">Email: {student.email}</p>
            )}
            {student.parent_phone && (
              <p className="mt-1 text-sm text-slate-600">
                Parent Phone: <ParentPhoneLink phone={student.parent_phone} />
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={student.is_active ? "success" : "neutral"}>
              {student.is_active ? "Active" : "Inactive"}
            </Badge>
            <EditStudentButton student={student} />
          </div>
        </div>
      </Card>

      <h3 className="mb-4 text-lg font-semibold text-slate-900">Summary</h3>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Overall Attendance"
          value={`${overallAttendance.attendance_percentage}%`}
        />
        <StatCard
          label="Average Marks"
          value={
            summary.average_marks_percentage !== null
              ? `${summary.average_marks_percentage}%`
              : "—"
          }
        />
        <StatCard
          label="Latest Assessment"
          value={
            summary.latest_assessment
              ? summary.latest_assessment.marks_obtained !== null
                ? `${summary.latest_assessment.marks_obtained}/${summary.latest_assessment.max_marks}`
                : "Absent"
              : "—"
          }
        />
      </div>

      <StudentAttendanceSection
        classId={cls.id}
        studentId={student.id}
        initialAttendance={attendance}
        overallAttendance={overallAttendance}
      />

      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Marks</h3>
          <ButtonLink
            href={`/classes/${cls.id}/assessments`}
            variant="secondary"
            size="sm"
          >
            View Assessments
          </ButtonLink>
        </div>

        {assessments.length === 0 ? (
          <p className="text-sm text-slate-600">No assessment marks recorded yet.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Assessment</TableHeaderCell>
                <TableHeaderCell>Subject</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Marks</TableHeaderCell>
                <TableHeaderCell>%</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((entry) => (
                <TableRow key={entry.assessment_id}>
                  <TableCell>
                    {formatDisplayDate(new Date(entry.assessment_date + "T00:00:00Z"))}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/classes/${cls.id}/assessments/${entry.assessment_id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {entry.assessment_name}
                    </Link>
                  </TableCell>
                  <TableCell>{entry.subject_name}</TableCell>
                  <TableCell>{ASSESSMENT_TYPE_LABELS[entry.assessment_type]}</TableCell>
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
      </Card>
    </>
  );
}
