import { prisma } from "@/lib/db";
import { parseISODate, todayISO } from "@/lib/dates";

export async function getActiveAcademicYear() {
  return prisma.academicYear.findFirst({
    where: { isActive: true },
  });
}

export async function getActiveClasses() {
  const activeYear = await getActiveAcademicYear();
  if (!activeYear) return { activeYear: null, classes: [] };

  const today = todayISO();
  const classes = await prisma.class.findMany({
    where: { academicYearId: activeYear.id, isActive: true },
    orderBy: [{ level: "asc" }, { stream: "asc" }],
    include: {
      _count: { select: { students: { where: { isActive: true } } } },
      attendanceSessions: {
        where: { attendanceDate: parseISODate(today) },
        take: 1,
      },
    },
  });

  return { activeYear, classes };
}

export async function getClassById(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      academicYear: true,
      _count: { select: { students: { where: { isActive: true } } } },
    },
  });
}

export async function getClassDetail(classId: string) {
  return prisma.class.findUnique({
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
}
