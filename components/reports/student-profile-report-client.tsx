"use client";

import { useState } from "react";
import ReportHeader, { ReportFooter } from "@/components/reports/report-header";
import ReportPrintActions from "@/components/reports/report-print-actions";
import StudentProfileReportView from "@/components/reports/student-profile-report-view";
import Alert from "@/components/ui/alert";
import FormField, { SelectInput } from "@/components/ui/form-field";
import LoadingState from "@/components/ui/loading-state";
import type { StudentProfileReport } from "@/lib/types/student-profile-report";
import type { StudentProfileListItem } from "@/lib/types/student-profile";
import type { ReportSettings } from "@/lib/types/settings";
import { useClientEffect } from "@/lib/use-client-effect";

type StudentProfileReportClientProps = {
  classId: string;
  students: StudentProfileListItem[];
  reportSettings: ReportSettings;
};

export default function StudentProfileReportClient({
  classId,
  students,
  reportSettings,
}: StudentProfileReportClientProps) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [profiles, setProfiles] = useState<StudentProfileReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useClientEffect(async (signal) => {
    if (!studentId) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(
      `/api/classes/${classId}/reports/student-profile?${studentId === "all" ? "all_students=true" : `student_id=${studentId}`}`,
      { signal },
    );

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to load student profile.");
      setProfiles([]);
      setLoading(false);
      return;
    }

    setProfiles((await res.json()).profiles);
    setLoading(false);
  }, [classId, studentId]);

  return (
    <>
      <div className="mb-6 space-y-4 print:hidden">
        <FormField label="Student">
          <SelectInput
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={students.length === 0}
          >
            <option value="all">All students</option>
            {students.length === 0 ? (
              <option value="">No students</option>
            ) : (
              students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.roll_no}. {student.full_name}{student.is_active ? "" : " (Inactive)"}
                </option>
              ))
            )}
          </SelectInput>
        </FormField>
        <ReportPrintActions disabled={!profiles.length || loading} />
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {students.length === 0 ? (
        <p className="text-sm text-slate-600">No students in this class.</p>
      ) : loading ? (
        <LoadingState />
      ) : profiles.length ? (
        <div id="report-content">
          {profiles.map(profile => <article className="student-report" key={profile.student.id}>
          <ReportHeader
            settings={reportSettings}
            title="Student Profile Report"
            subtitle={`${profile.class.display_name} · ${profile.student.full_name}`}
          />
          <StudentProfileReportView profile={profile} />
          <ReportFooter settings={reportSettings} />
          </article>)}
        </div>
      ) : null}
    </>
  );
}
