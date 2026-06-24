import Link from "next/link";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "← Back",
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-block text-sm text-blue-600 hover:underline break-words"
        >
          <span className="sm:hidden">← Back</span>
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
      )}
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-600 break-words">{subtitle}</p>}
    </div>
  );
}
