import type { AttendanceStatus } from "@/lib/attendance";

export type AttendanceRecordRow = {
  student_id: string;
  roll_no: number;
  full_name: string;
  status: AttendanceStatus;
};

export type AttendanceSummary = {
  session_id: string;
  class: {
    id: string;
    display_name: string;
    whatsapp_number: string | null;
  };
  attendance_date: string;
  summary: { total: number; present: number; absent: number; late: number };
  absentees: { roll_no: number; full_name: string }[];
  late_students: { roll_no: number; full_name: string }[];
};

export type WhatsAppMessageData = {
  phone_number: string;
  message: string;
  whatsapp_url: string;
};
