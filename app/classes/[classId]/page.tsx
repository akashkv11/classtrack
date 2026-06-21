import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { todayISO } from "@/lib/dates";

type PageProps = { params: Promise<{ classId: string }> };

export default async function ClassDetailsPage({ params }: PageProps) {
  const { classId } = await params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      academicYear: true,
      _count: { select: { students: { where: { isActive: true } } } },
      attendanceSessions: {
        orderBy: { attendanceDate: "desc" },
        take: 10,
      },
    },
  });

  if (!cls) notFound();

  const today = todayISO();
  const todayMarked = cls.attendanceSessions.some(
    (s) => s.attendanceDate.toISOString().slice(0, 10) === today,
  );

  return (
    <>
      <AppHeader
        title={cls.displayName}
        subtitle={`${cls.academicYear.name} · ${cls._count.students} students`}
        backHref="/dashboard"
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Today&apos;s attendance</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {todayMarked ? "Marked" : "Not marked yet"}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href={`/classes/${classId}/attendance`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Mark Today&apos;s Attendance
          </Link>
          <Link
            href={`/classes/${classId}/students`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage the Students
          </Link>
          <Link
            href={`/classes/${classId}/reports`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Monthly Report
          </Link>
          <Link
            href={`/classes/${classId}/settings`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Class Settings
          </Link>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Attendance Dates</h2>
          {cls.attendanceSessions.length === 0 ? (
            <p className="text-sm text-slate-600">No attendance recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {cls.attendanceSessions.map((session) => {
                const date = session.attendanceDate.toISOString().slice(0, 10);
                return (
                  <li key={session.id}>
                    <Link
                      href={`/classes/${classId}/summary/${session.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {date}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
