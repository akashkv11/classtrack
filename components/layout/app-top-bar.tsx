"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppTopBar() {
  const router = useRouter();

  async function handleLock() {
    await fetch("/api/auth/lock", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <Link href="/dashboard" className="text-base font-bold text-slate-900 lg:hidden">
        ClassTrack
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
    </header>
  );
}
