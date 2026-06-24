import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  const classCount = activeYear
    ? await prisma.class.count({
        where: { academicYearId: activeYear.id, isActive: true },
      })
    : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Home</h1>
      <p className="mt-2 text-slate-600">
        Mark attendance, track reports, and notify parents instantly.
      </p>

      {activeYear ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Active academic year</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{activeYear.name}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Active classes</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{classCount}</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          No active academic year configured. Go to Settings to set one up.
        </div>
      )}
    </main>
  );
}
