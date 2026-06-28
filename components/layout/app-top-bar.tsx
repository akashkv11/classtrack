"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { mainNavItems } from "@/lib/navigation";

type AppTopBarProps = {
  onMenuClick: () => void;
};

export default function AppTopBar({ onMenuClick }: AppTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLock() {
    await fetch("/api/auth/lock", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
      >
        Menu
      </button>
      <Link href="/dashboard" className="text-lg font-bold text-slate-900 lg:hidden">
        ClassTrack
      </Link>
      <nav className="hidden items-center gap-4 md:flex">
        {mainNavItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                active ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleLock}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Lock
        </button>
      </div>
    </header>
  );
}
