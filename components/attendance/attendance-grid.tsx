import type { AttendanceStatus } from "@/lib/attendance";
import type { AttendanceRecordRow } from "@/lib/types";

type AttendanceGridProps = {
  records: AttendanceRecordRow[];
  onToggle: (studentId: string) => void;
};

function isPresentStatus(status: AttendanceStatus): boolean {
  return status === "present" || status === "late";
}

export default function AttendanceGrid({ records, onToggle }: AttendanceGridProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {records.map((record) => {
        const present = isPresentStatus(record.status);
        return (
          <li key={record.student_id}>
            <button
              type="button"
              onClick={() => onToggle(record.student_id)}
              aria-pressed={present}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                present
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  present ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {record.roll_no}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm ${
                    present ? "font-semibold text-slate-900" : "text-slate-700"
                  }`}
                >
                  {record.full_name}
                </span>
                <span
                  className={`mt-0.5 block text-xs font-medium ${
                    present ? "text-green-700" : "text-slate-500"
                  }`}
                >
                  {present ? "Present · tap to mark absent" : "Absent · tap to mark present"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export { isPresentStatus };
