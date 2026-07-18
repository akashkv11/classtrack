import type { AttendanceStatus } from "@/lib/attendance";
import type { WhatsAppMissingItem } from "@/lib/whatsapp-readiness";

export type AttendanceRecordRow = {
  student_id: string;
  roll_no: number;
  full_name: string;
  status: AttendanceStatus;
};

export type AttendanceSessionOnDate = {
  id: string;
  attendance_date: string;
  timetable_entry_id: string | null;
  timetable_subject: string | null;
  timetable_start_time: string | null;
  timetable_end_time: string | null;
  record_count: number;
  created_at: string;
};

export type AttendanceSummary = {
  session_id: string;
  class: {
    id: string;
    display_name: string;
    whatsapp_number: string | null;
  };
  attendance_date: string;
  timetable_entry_id: string | null;
  timetable_subject: string | null;
  timetable_start_time: string | null;
  timetable_end_time: string | null;
  summary: { total: number; present: number; absent: number; late: number };
  absentees: { roll_no: number; full_name: string }[];
  late_students: { roll_no: number; full_name: string }[];
};

export type WhatsAppMessageData = {
  phone_number: string;
  message: string;
  whatsapp_url: string;
  class_id: string;
  attendance_date: string;
  class_time: string | null;
  missing_items: WhatsAppMissingItem[];
};
