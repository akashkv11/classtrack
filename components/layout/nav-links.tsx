"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems, navLinkClassName } from "@/lib/navigation";

type NavLinksProps = {
  onNavigate?: () => void;
};

export default function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {mainNavItems.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${navLinkClassName(active)}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
