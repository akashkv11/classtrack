export type StudentProfileReport = {
  student: { id: string; roll_no: number; full_name: string; admission_no: string | null; email: string | null; parent_phone: string | null; is_active: boolean };
  class: { id: string; display_name: string; academic_year: string };
  summary: { total_sessions: number; present: number; absent: number; late: number; unmarked: number; attendance_percentage: number; average_marks_percentage: number | null };
  attendance: { session_id: string; date: string; subject: string | null; start_time: string | null; end_time: string | null; status: string }[];
  assessments: { id: string; name: string; date: string; type: string; subject: string; marks: number | null; max_marks: number; percentage: number | null }[];
  preparation: { id: string; date: string; scope: string; subject: string | null; start_time: string | null; end_time: string | null; status: string }[];
};
