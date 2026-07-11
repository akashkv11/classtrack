import Link from "next/link";
import Card from "@/components/ui/card";

type AcademicWorkLinksProps = {
  classId: string;
};

const links = [
  { href: (id: string) => `/classes/${id}/attendance`, label: "Attendance", enabled: true },
  { href: (id: string) => `/classes/${id}#students`, label: "Students", enabled: true },
  { href: (id: string) => `/classes/${id}/syllabus`, label: "Syllabus", enabled: true },
  { href: (id: string) => `/classes/${id}/teaching-diary`, label: "Teaching Diary", enabled: true },
  { href: (id: string) => `/classes/${id}/reports`, label: "Reports", enabled: true },
  { href: () => "#", label: "Marks", enabled: false },
] as const;

export default function AcademicWorkLinks({ classId }: AcademicWorkLinksProps) {
  return (
    <Card className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Academic Work
      </h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) =>
          link.enabled ? (
            <Link
              key={link.label}
              href={link.href(classId)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              {link.label}
            </Link>
          ) : (
            <span
              key={link.label}
              className="rounded-lg border border-dashed border-slate-200 px-4 py-2 text-sm text-slate-400"
            >
              {link.label}
            </span>
          ),
        )}
      </div>
    </Card>
  );
}
