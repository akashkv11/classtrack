"use client";

import Link from "next/link";
import LockButton from "@/components/layout/lock-button";

type AppTopBarProps = {
  onMenuClick: () => void;
};

export default function AppTopBar({ onMenuClick }: AppTopBarProps) {
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
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LockButton className="w-auto" />
      </div>
    </header>
  );
}
