"use client";

import Link from "next/link";
import NavLinks from "@/components/layout/nav-links";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white lg:hidden">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/today" className="text-lg font-bold text-slate-900" onClick={onClose}>
            ClassTrack
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
