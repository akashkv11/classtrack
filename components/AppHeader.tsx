"use client";

import Link from "next/link";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
};

export default function AppHeader({ title, subtitle, backHref }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div>
        {backHref && (
          <Link href={backHref} className="mb-1 inline-block text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
        )}
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
    </header>
  );
}
