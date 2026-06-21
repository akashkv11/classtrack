"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useClientEffect } from "@/lib/use-client-effect";

type ReportStudent = {
  roll_no: number;
  full_name: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
};

type Report = {
  class: { id: string; display_name: string };
  month: string;
  working_days: number;
  students: ReportStudent[];
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyReportPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;

  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<Report | null>(null);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  useClientEffect(async (signal) => {
    setLoading(true);
    const [reportRes, classRes] = await Promise.all([
      fetch(`/api/reports/monthly?class_id=${classId}&month=${month}`, { signal }),
      fetch(`/api/classes/${classId}`, { signal }),
    ]);
    setReport(await reportRes.json());
    const cls = await classRes.json();
    setClassName(cls.display_name ?? "");
    setLoading(false);
  }, [classId, month]);

  return (
    <>
      <AppHeader
        title="Monthly Report"
        subtitle={className}
        backHref={`/classes/${classId}`}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-slate-700">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : report ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Working days: <span className="font-medium">{report.working_days}</span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-700">Roll No</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Student Name</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Present</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Absent</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Late</th>
                    <th className="px-4 py-3 font-medium text-slate-700">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((student) => (
                    <tr key={student.roll_no} className="border-b border-slate-100">
                      <td className="px-4 py-3">{student.roll_no}</td>
                      <td className="px-4 py-3">{student.full_name}</td>
                      <td className="px-4 py-3">{student.present_days}</td>
                      <td className="px-4 py-3">{student.absent_days}</td>
                      <td className="px-4 py-3">{student.late_days}</td>
                      <td className="px-4 py-3 font-medium">{student.attendance_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}
