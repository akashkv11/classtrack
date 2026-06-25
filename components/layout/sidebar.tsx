"use client";

import Link from "next/link";
import NavLinks from "@/components/layout/nav-links";

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <Link href="/today" className="text-lg font-bold text-slate-900">
          ClassTrack
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks />
      </div>
    </aside>
  );
}
