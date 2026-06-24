"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems, navLinkClassName } from "@/lib/navigation";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {mainNavItems.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center px-2 py-3 text-xs font-medium transition-colors ${navLinkClassName(active)}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
