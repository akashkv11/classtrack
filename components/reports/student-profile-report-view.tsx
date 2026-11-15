import type { ReactNode } from "react";
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/ui/card";
import { ASSESSMENT_TYPE_LABELS } from "@/lib/assessments/types";
import { PREPARATION_LABELS, type PreparationStatus } from "@/lib/preparation";
import { formatDisplayDate } from "@/lib/dates";
import { formatClassTimeRange } from "@/lib/whatsapp";
import type { AssessmentType } from "@/lib/types/assessment";
import type { StudentProfileReport } from "@/lib/types/student-profile-report";

const date = (value: string) => formatDisplayDate(new Date(`${value}T00:00:00Z`));
const time = (start: string | null, end: string | null) => start && end ? formatClassTimeRange(start, end) : "Time not recorded";
function History({ title, headers, rows }: { title: string; headers: string[]; rows: ReactNode[][] }) {
  return <section><h3 className="mb-3 text-lg font-semibold">{title}</h3>{rows.length ? <Table><TableHead><TableRow>{headers.map(h => <TableHeaderCell key={h}>{h}</TableHeaderCell>)}</TableRow></TableHead><TableBody>{rows.map((cells, i) => <TableRow key={i}>{cells.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table> : <p>No records available.</p>}</section>;
}
export default function StudentProfileReportView({ profile }: { profile: StudentProfileReport }) {
  const { student: s, summary: totals } = profile;
  const latest = profile.assessments[0];
  return <div className="space-y-6">
    <section><h2 className="text-xl font-semibold">{s.full_name}</h2><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      {Object.entries({ "Roll number": s.roll_no, "Admission number": s.admission_no, Class: profile.class.display_name,
        "Academic year": profile.class.academic_year, Email: s.email, "Parent phone": s.parent_phone, Status: s.is_active ? "Active" : "Inactive" }).map(([label, value]) => <div key={label}><dt className="inline font-medium">{label}: </dt><dd className="inline">{value ?? "Not recorded"}</dd></div>)}
    </dl></section>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Overall attendance" value={`${totals.attendance_percentage}%`} />
      <StatCard label="Total sessions" value={totals.total_sessions} /><StatCard label="Present sessions" value={totals.present} />
      <StatCard label="Absent sessions" value={totals.absent} /><StatCard label="Late sessions" value={totals.late} />
      <StatCard label="Unmarked sessions" value={totals.unmarked} /><StatCard label="Average marks" value={totals.average_marks_percentage === null ? "Not recorded" : `${totals.average_marks_percentage}%`} />
    </div>
    <p>Latest assessment: {latest ? `${latest.name} — ${latest.marks === null ? "Absent" : `${latest.marks}/${latest.max_marks}`} (${date(latest.date)})` : "Not recorded"}</p>
    <History title="Attendance history" headers={["Date", "Subject", "Time", "Attendance"]} rows={profile.attendance.map(a => [date(a.date), a.subject ?? "Not recorded", time(a.start_time, a.end_time), a.status === "not_marked" ? "Not marked" : a.status.charAt(0).toUpperCase() + a.status.slice(1)])} />
    <History title="Assessment history" headers={["Date", "Assessment", "Type", "Subject", "Marks", "%"]} rows={profile.assessments.map(a => [date(a.date), a.name, ASSESSMENT_TYPE_LABELS[a.type as AssessmentType] ?? a.type, a.subject, a.marks === null ? "Absent" : `${a.marks}/${a.max_marks}`, a.percentage === null ? "—" : `${a.percentage}%`])} />
    <History title="Preparation history" headers={["Date", "Scope / Subject", "Time", "Preparation"]} rows={profile.preparation.map(p => [date(p.date), p.scope === "daily" ? "Daily preparation" : p.subject ?? "Not recorded", p.scope === "daily" ? "Whole day" : time(p.start_time, p.end_time), PREPARATION_LABELS[p.status as PreparationStatus] ?? "Not recorded"])} />
  </div>;
}
