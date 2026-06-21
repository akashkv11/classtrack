"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
};

export default function AppHeader({ title, subtitle, backHref }: AppHeaderProps) {
  const router = useRouter();

  async function handleLock() {
    await fetch("/api/auth/lock", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div>
          {backHref && (
            <Link href={backHref} className="mb-1 inline-block text-sm text-blue-600 hover:underline">
              ← Back
            </Link>
          )}
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Settings
          </Link>
          <button
            onClick={handleLock}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Lock
          </button>
        </div>
      </div>
    </header>
  );
}
