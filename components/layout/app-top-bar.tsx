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
    <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 py-3">
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
    </header>
  );
}
