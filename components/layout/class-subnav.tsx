"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionalClass } from "@/components/classes/class-provider";
import { classNavItems, classSubnavClassName } from "@/lib/class-navigation";

export default function ClassSubnav() {
  const pathname = usePathname();
  const classContext = useOptionalClass();

  if (!classContext) return null;

  const { classId, displayName } = classContext;

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
          {displayName}
        </Link>
      </div>
      <nav
        aria-label="Class sections"
        className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6"
      >
        {classNavItems.map((item) => {
          const active = item.match(pathname, classId);
          return (
            <Link
              key={item.id}
              href={item.href(classId)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${classSubnavClassName(active)}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
