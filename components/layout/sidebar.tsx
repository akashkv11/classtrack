"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems, navLinkClassName } from "@/lib/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-200 px-5 py-5">
        <Link href="/dashboard" className="text-lg font-bold text-slate-900">
          ClassTrack
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {mainNavItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${navLinkClassName(active)}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
