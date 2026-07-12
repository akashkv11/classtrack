"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getModuleById, navGroups, navLinkClassName } from "@/lib/navigation";

type NavLinksProps = {
  onNavigate?: () => void;
};

export default function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.moduleIds.map((moduleId) => {
              const item = getModuleById(moduleId);
              if (!item) return null;

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
          </div>
        </div>
      ))}
    </nav>
  );
}
