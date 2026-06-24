import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { ReportStudent } from "@/lib/types";

type MonthlyReportTableProps = {
  students: ReportStudent[];
};

export default function MonthlyReportTable({ students }: MonthlyReportTableProps) {
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
          <TableRow key={student.roll_no}>
            <TableCell>{student.roll_no}</TableCell>
            <TableCell>{student.full_name}</TableCell>
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
