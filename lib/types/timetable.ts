export type ScheduleType = "one_time" | "repeating";

export type TimetableScheduleException = {
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
};

export type TimetableEntrySummary = {
  id: string;
  class_id: string;
  class_name: string;
  subject: string;
  schedule_type: ScheduleType;
  entry_date: string | null;
  start_time: string;
  end_time: string;
  repeat_days: string[];
  schedule_exceptions: TimetableScheduleException[];
  repeat_start: string | null;
  repeat_end: string | null;
  notes: string | null;
  is_active: boolean;
};

export type TimetableOverlap = {
  entry_id: string;
  class_name: string;
  subject: string;
  date: string | null;
  start_time: string;
  end_time: string;
};

export type TodayScheduleItem = {
  entry_id: string;
  period_number: number;
  class_id: string;
  class_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  schedule_type: ScheduleType;
  has_time_exception: boolean;
  attendance_status: "marked" | "not_marked";
  attendance_session_id: string | null;
  teaching_diary_status: "pending" | "written";
};
