import Link from "next/link";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { ReportStudent } from "@/lib/types";

type MonthlyReportTableProps = {
  classId: string;
  students: ReportStudent[];
};

export default function MonthlyReportTable({
  classId,
  students,
}: MonthlyReportTableProps) {
  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Roll No</TableHeaderCell>
          <TableHeaderCell>Student Name</TableHeaderCell>
          <TableHeaderCell>Present</TableHeaderCell>
          <TableHeaderCell>Absent</TableHeaderCell>
          <TableHeaderCell>Late</TableHeaderCell>
          <TableHeaderCell>Attendance %</TableHeaderCell>
        </tr>
      </TableHead>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.student_id}>
            <TableCell>{student.roll_no}</TableCell>
            <TableCell>
              <Link
                href={`/classes/${classId}/students/${student.student_id}`}
                className="font-medium text-blue-700 hover:underline print:text-slate-900 print:no-underline"
              >
                {student.full_name}
              </Link>
            </TableCell>
            <TableCell>{student.present_days}</TableCell>
            <TableCell>{student.absent_days}</TableCell>
            <TableCell>{student.late_days}</TableCell>
            <TableCell className="font-medium">{student.attendance_percentage}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
