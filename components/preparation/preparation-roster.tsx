"use client";

import { countsAsUnprepared, type PreparationStudent, type PreparationStatus } from "@/lib/preparation";

const statusStyles = {
  FULL: {
    card: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    hint: "Fully prepared · tap for not prepared",
    hintColor: "text-slate-500",
  },
  NONE: {
    card: "border-red-500 bg-red-50 shadow-sm",
    badge: "bg-red-600 text-white",
    hint: "Not prepared · tap for fully prepared",
    hintColor: "text-red-700",
  },
  PARTIAL: {
    card: "border-amber-500 bg-amber-50 shadow-sm",
    badge: "bg-amber-500 text-white",
    hint: "Partially prepared · tap for fully prepared",
    hintColor: "text-amber-700",
  },
  NOT_MARKED: {
    card: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    hint: "Not marked · tap for not prepared",
    hintColor: "text-slate-500",
  },
} as const;

export default function PreparationRoster({ students, onChange, disabled, threshold, includePartial }: {
  students: PreparationStudent[];
  onChange: (students: PreparationStudent[]) => void;
  disabled: boolean;
  threshold: number;
  includePartial: boolean;
}) {
  function setStatus(studentId: string, status: PreparationStatus) {
    onChange(students.map((student) => student.student_id === studentId
      ? { ...student, preparation_status: status } : student));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Tap students who are not prepared. Tap <span className="font-semibold text-amber-700">P</span> at
        the end of a row for partially prepared. Everyone else is saved as fully prepared.
        Notes are added automatically for students marked not prepared or partially prepared.
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm" aria-live="polite">
        <span className="text-green-700">{students.filter((student) => student.preparation_status === "FULL").length} fully prepared</span>
        <span className="text-amber-700">{students.filter((student) => student.preparation_status === "PARTIAL").length} partially prepared</span>
        <span className="text-red-700">{students.filter((student) => student.preparation_status === "NONE").length} not prepared</span>
      </p>
      <fieldset disabled={disabled}>
        <legend className="sr-only">Student preparation</legend>
        <ul className="space-y-2">
          {students.map((student) => {
            const styles = statusStyles[student.preparation_status];
            const isPartial = student.preparation_status === "PARTIAL";
            const isSelected = student.preparation_status === "NONE" || isPartial;
            const streak = countsAsUnprepared(student.preparation_status, includePartial) ? student.previous_streak + 1 : 0;
            return (
              <li key={student.student_id} className={`rounded-xl border-2 px-4 py-3 transition ${styles.card}`}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`Preparation for ${student.full_name}: ${styles.hint}`}
                    onClick={() => setStatus(student.student_id, isSelected ? "FULL" : "NONE")}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${styles.badge}`}>
                      {student.roll_no}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm text-slate-900 ${isSelected ? "font-semibold" : ""}`}>{student.full_name}</span>
                      <span className={`mt-0.5 block text-xs font-medium ${styles.hintColor}`}>{styles.hint}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(student.student_id, isPartial ? "FULL" : "PARTIAL")}
                    aria-pressed={isPartial}
                    aria-label={`Partially prepared: ${student.full_name}`}
                    title="Partially prepared"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition disabled:cursor-not-allowed ${
                      isPartial ? "bg-amber-500 text-white shadow-sm"
                        : "border border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    P
                  </button>
                </div>
                {streak > 0 && (
                  <p className={`mt-2 text-xs ${streak >= threshold ? "font-semibold text-red-700" : "text-amber-800"}`}>
                    {streak >= threshold ? "Follow-up needed · " : ""}{streak} consecutive recorded class{streak === 1 ? "" : "es"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {students.length === 0 && <p className="text-sm text-slate-600">No students in this class.</p>}
      </fieldset>
      <p className="text-xs text-slate-500">
        Follow-up alerts start at {threshold} consecutive recorded classes {includePartial ? "partially or not prepared" : "not prepared"}.
      </p>
    </div>
  );
}
