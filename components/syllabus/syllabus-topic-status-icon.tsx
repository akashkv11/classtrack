import { STATUS_LABELS } from "@/lib/syllabus/progress";

const STATUS_STYLES: Record<string, { ring: string; fill: string }> = {
  NOT_STARTED: { ring: "border-slate-300 bg-white", fill: "" },
  IN_PROGRESS: { ring: "border-blue-500 bg-blue-100", fill: "bg-blue-500" },
  COMPLETED: { ring: "border-green-600 bg-green-600", fill: "bg-white" },
  REVISED: { ring: "border-emerald-700 bg-emerald-700", fill: "bg-white" },
  SKIPPED: { ring: "border-amber-500 bg-amber-100", fill: "bg-amber-500" },
};

type SyllabusTopicStatusIconProps = {
  status: string;
  className?: string;
};

export default function SyllabusTopicStatusIcon({
  status,
  className = "",
}: SyllabusTopicStatusIconProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.NOT_STARTED;
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
  const isDone = status === "COMPLETED" || status === "REVISED";

  return (
    <span
      className={`relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${styles.ring} ${className}`}
      aria-label={label}
      title={label}
    >
      {isDone && (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" aria-hidden="true">
          <path
            d="M2.5 6.5 5 9l4.5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status === "IN_PROGRESS" && (
        <span className={`h-2 w-2 rounded-full ${styles.fill}`} aria-hidden="true" />
      )}
      {status === "SKIPPED" && (
        <span className={`h-0.5 w-2 rounded-full ${styles.fill}`} aria-hidden="true" />
      )}
    </span>
  );
}
