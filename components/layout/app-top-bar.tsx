"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LockButton from "@/components/layout/lock-button";
import { useOptionalClass } from "@/components/classes/class-provider";
import { getPageTitleFromPath } from "@/lib/page-titles";

type AppTopBarProps = {
  onMenuClick: () => void;
};

export default function AppTopBar({ onMenuClick }: AppTopBarProps) {
  const pathname = usePathname();
  const classContext = useOptionalClass();
  const pageTitle = getPageTitleFromPath(pathname);

  return (
    <header
      data-print-hide
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6"
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
      >
        Menu
      </button>
      <div className="min-w-0 flex-1 lg:hidden">
        {classContext ? (
          <div className="min-w-0">
            <Link
              href={`/classes/${classContext.classId}`}
              className="block truncate text-sm font-semibold text-slate-900"
            >
              {classContext.displayName}
            </Link>
            {pageTitle && pageTitle !== "Class Overview" && (
              <p className="truncate text-xs text-slate-500">{pageTitle}</p>
            )}
          </div>
        ) : (
          <Link href="/dashboard" className="block truncate text-lg font-bold text-slate-900">
            {pageTitle ?? "ClassTrack"}
          </Link>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LockButton className="w-auto" />
      </div>
    </header>
  );
}
