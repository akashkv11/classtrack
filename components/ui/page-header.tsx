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
        <Link href={backHref} className="mb-2 inline-block text-sm text-blue-600 hover:underline">
          {backLabel}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
    </div>
  );
}
