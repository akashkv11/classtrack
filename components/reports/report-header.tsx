import type { ReportSettings } from "@/lib/types/settings";
import { formatDisplayDate } from "@/lib/dates";

type ReportHeaderProps = {
  settings: ReportSettings;
  title?: string;
  subtitle?: string;
};

export default function ReportHeader({ settings, title, subtitle }: ReportHeaderProps) {
  const displayTitle = title || settings.report_title || "Report";
  const generatedAt = formatDisplayDate(new Date());

  const hasHeader =
    settings.institution_name ||
    displayTitle ||
    settings.teacher_name ||
    subtitle;

  if (!hasHeader) return null;

  return (
    <div className="report-header mb-6 border-b border-slate-200 pb-4 print:mb-4">
      {settings.institution_name && (
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          {settings.institution_name}
        </p>
      )}
      <h2 className="mt-1 text-xl font-semibold text-slate-900">{displayTitle}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-700">{subtitle}</p>}
      {settings.teacher_name && (
        <p className="mt-2 text-sm text-slate-600">Teacher: {settings.teacher_name}</p>
      )}
      <p className="mt-2 text-xs text-slate-500">Generated: {generatedAt}</p>
    </div>
  );
}

type ReportFooterProps = {
  settings: ReportSettings;
};

export function ReportFooter({ settings }: ReportFooterProps) {
  if (!settings.report_footer && !settings.message_signature) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-600 print:mt-6">
      {settings.report_footer && <p>{settings.report_footer}</p>}
      {settings.message_signature && <p className="mt-1">{settings.message_signature}</p>}
    </div>
  );
}
