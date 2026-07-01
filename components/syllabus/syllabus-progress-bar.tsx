import type { SyllabusStatusSummary } from "@/lib/types/syllabus";
import { STATUS_LABELS } from "@/lib/syllabus/progress";

export type SyllabusProgressBreakdown = Pick<
  SyllabusStatusSummary,
  | "total"
  | "not_started"
  | "in_progress"
  | "completed"
  | "revised"
  | "skipped"
  | "progress_percentage"
>;

const SEGMENTS = [
  { key: "completed", field: "completed" as const, color: "bg-green-500", label: STATUS_LABELS.COMPLETED },
  { key: "revised", field: "revised" as const, color: "bg-emerald-600", label: STATUS_LABELS.REVISED },
  { key: "in_progress", field: "in_progress" as const, color: "bg-blue-500", label: STATUS_LABELS.IN_PROGRESS },
  { key: "skipped", field: "skipped" as const, color: "bg-amber-400", label: STATUS_LABELS.SKIPPED },
  { key: "not_started", field: "not_started" as const, color: "bg-slate-200", label: STATUS_LABELS.NOT_STARTED },
];

type SyllabusProgressBarProps = {
  breakdown: SyllabusProgressBreakdown;
  size?: "sm" | "md";
  showPercentage?: boolean;
  className?: string;
};

export function SyllabusProgressBar({
  breakdown,
  size = "md",
  showPercentage = true,
  className = "",
}: SyllabusProgressBarProps) {
  const heightClass = size === "sm" ? "h-2" : "h-3";

  return (
    <div className={className}>
      {showPercentage && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">Progress</p>
          <p className="text-sm font-semibold text-slate-900">
            {breakdown.progress_percentage}%
          </p>
        </div>
      )}
      <div
        className={`flex overflow-hidden rounded-full bg-slate-100 ${heightClass}`}
        role="progressbar"
        aria-valuenow={breakdown.progress_percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Syllabus progress ${breakdown.progress_percentage}%`}
      >
        {breakdown.total === 0 ? (
          <div className="h-full w-full bg-slate-200" />
        ) : (
          SEGMENTS.map((segment) => {
            const count = breakdown[segment.field];
            if (count <= 0) return null;
            const width = (count / breakdown.total) * 100;
            return (
              <div
                key={segment.key}
                className={`h-full ${segment.color}`}
                style={{ width: `${width}%` }}
                title={`${segment.label}: ${count}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

type SyllabusProgressLegendProps = {
  breakdown: SyllabusProgressBreakdown;
  className?: string;
};

export function SyllabusProgressLegend({
  breakdown,
  className = "",
}: SyllabusProgressLegendProps) {
  const items = SEGMENTS.filter((segment) => breakdown[segment.field] > 0);

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`}>
      {items.map((segment) => (
        <div key={segment.key} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className={`inline-block h-2 w-2 rounded-full ${segment.color}`} />
          <span>
            {segment.label}: {breakdown[segment.field]}
          </span>
        </div>
      ))}
    </div>
  );
}

type SyllabusProgressPanelProps = {
  breakdown: SyllabusProgressBreakdown;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md";
  showLegend?: boolean;
  className?: string;
};

export function SyllabusProgressPanel({
  breakdown,
  title,
  subtitle,
  size = "md",
  showLegend = true,
  className = "",
}: SyllabusProgressPanelProps) {
  const doneCount = breakdown.completed + breakdown.revised;

  return (
    <div className={className}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <p className="text-sm font-medium text-slate-700">{title}</p>}
          {subtitle && <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>}
        </div>
      )}
      <SyllabusProgressBar breakdown={breakdown} size={size} />
      <p className="mt-2 text-sm text-slate-600">
        {doneCount} of {breakdown.total} topics completed
      </p>
      {showLegend && <SyllabusProgressLegend breakdown={breakdown} className="mt-3" />}
    </div>
  );
}
