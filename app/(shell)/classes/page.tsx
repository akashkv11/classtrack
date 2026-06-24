import ClassListCard from "@/components/ClassListCard";
import { prisma } from "@/lib/db";
import { parseISODate, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
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
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
      {activeYear && (
        <p className="mt-2 text-sm text-slate-600">
          Academic Year: <span className="font-medium">{activeYear.name}</span>
        </p>
      )}

      {!activeYear ? (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          No active academic year configured. Go to Settings to set one up.
        </div>
      ) : classes.length === 0 ? (
        <p className="mt-8 text-slate-600">No classes found for this academic year.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {classes.map((cls) => {
            const todaySession = cls.attendanceSessions[0] ?? null;
            return (
              <ClassListCard
                key={cls.id}
                id={cls.id}
                displayName={cls.displayName}
                studentCount={cls._count.students}
                todayStatus={todaySession ? "marked" : "not_marked"}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
