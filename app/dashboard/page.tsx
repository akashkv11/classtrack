import AppHeader from "@/components/AppHeader";
import ClassCard from "@/components/ClassCard";
import { prisma } from "@/lib/db";
import { todayISO, parseISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  const today = todayISO();

  const classes = activeYear
    ? await prisma.class.findMany({
        where: { academicYearId: activeYear.id, isActive: true },
        orderBy: [{ level: "asc" }, { stream: "asc" }],
        include: {
          _count: { select: { students: { where: { isActive: true } } } },
          attendanceSessions: {
            where: { attendanceDate: parseISODate(today) },
            take: 1,
          },
        },
      })
    : [];

  return (
    <>
      <AppHeader
        title="ClassTrack"
        subtitle="Mark attendance, track reports, and notify instantly."
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {activeYear && (
          <p className="mb-6 text-sm text-slate-600">
            Academic Year: <span className="font-medium">{activeYear.name}</span>
          </p>
        )}

        {!activeYear ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            No active academic year configured. Go to Settings to set one up.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                id={cls.id}
                displayName={cls.displayName}
                studentCount={cls._count.students}
                todayStatus={cls.attendanceSessions.length > 0 ? "marked" : "not_marked"}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
