import Link from "next/link";

type ReportHubCardProps = {
  href: string;
  title: string;
  description: string;
};

export default function ReportHubCard({ href, title, description }: ReportHubCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
}
