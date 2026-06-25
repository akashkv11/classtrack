import type { AttendanceStatus } from "@/lib/attendance";
import type { AttendanceRecordRow } from "@/lib/types";

type AttendanceGridProps = {
  records: AttendanceRecordRow[];
  onToggle: (studentId: string) => void;
  onMarkLate: (studentId: string) => void;
};

const statusStyles: Record<
  AttendanceStatus,
  { card: string; badge: string; name: string; hint: string; hintColor: string }
> = {
  present: {
    card: "border-green-500 bg-green-50 shadow-sm",
    badge: "bg-green-600 text-white",
    name: "font-semibold text-slate-900",
    hint: "Present · tap for absent",
    hintColor: "text-green-700",
  },
  absent: {
    card: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    name: "text-slate-700",
    hint: "Absent · tap for present",
    hintColor: "text-slate-500",
  },
  late: {
    card: "border-amber-500 bg-amber-50 shadow-sm",
    badge: "bg-amber-500 text-white",
    name: "font-semibold text-slate-900",
    hint: "Late · tap for present",
    hintColor: "text-amber-700",
  },
};

export default function AttendanceGrid({ records, onToggle, onMarkLate }: AttendanceGridProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {records.map((record) => {
        const styles = statusStyles[record.status];
        const isLate = record.status === "late";

        return (
          <li key={record.student_id}>
            <div
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${styles.card}`}
            >
              <button
                type="button"
                onClick={() => onToggle(record.student_id)}
                aria-pressed={record.status !== "absent"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${styles.badge}`}
              >
                {record.roll_no}
              </button>
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(record.student_id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className={`block truncate text-sm ${styles.name}`}>
                    {record.full_name}
                  </span>
                  <span className={`mt-0.5 block text-xs font-medium ${styles.hintColor}`}>
                    {styles.hint}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onMarkLate(record.student_id)}
                  aria-pressed={isLate}
                  aria-label={isLate ? "Marked late" : "Mark late"}
                  title="Mark late"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    isLate
                      ? "bg-amber-500 text-white shadow-sm"
                      : "border border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  L
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
