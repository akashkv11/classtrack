import Link from "next/link";

export type LinkGridItem = {
  href: string;
  label: string;
  description?: string;
};

type LinkGridProps = {
  items: LinkGridItem[];
};

export default function LinkGrid({ items }: LinkGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-colors hover:border-blue-200 hover:bg-blue-50/50"
        >
          <span className="font-medium text-slate-900">{item.label}</span>
          {item.description && (
            <span className="mt-0.5 block text-xs text-slate-600">{item.description}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
