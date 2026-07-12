"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionalClass } from "@/components/classes/class-provider";
import { useNavigation } from "@/components/layout/navigation-provider";
import { classNavItems, classSubnavClassName } from "@/lib/class-navigation";

type ClassSubnavProps = {
  displayName?: string;
};

function normalizeHref(href: string) {
  try {
    const url = new URL(href, "http://local");
    return url.pathname + url.search;
  } catch {
    return href;
  }
}

export default function ClassSubnav({ displayName }: ClassSubnavProps) {
  const pathname = usePathname();
  const classContext = useOptionalClass();
  const { pendingHref } = useNavigation();

  if (!classContext) return null;

  const { classId } = classContext;
  const label = displayName ?? classContext.displayName;

  return (
    <div
      data-print-hide
      className="sticky top-16 z-20 border-b border-slate-200 bg-white"
    >
      <div className="hidden border-b border-slate-100 px-4 py-2 lg:block lg:px-6">
        <Link
          href={`/classes/${classId}`}
          className="text-sm font-semibold text-slate-900 hover:text-blue-700"
        >
          {label}
        </Link>
      </div>
      <nav
        aria-label="Class sections"
        className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6"
      >
        {classNavItems.map((item) => {
          const href = item.href(classId);
          const active = item.match(pathname, classId);
          const pending = pendingHref === normalizeHref(href);

          return (
            <Link
              key={item.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${classSubnavClassName(active)} ${
                pending ? "opacity-70" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
