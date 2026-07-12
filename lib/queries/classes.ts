import { cache } from "react";
import { prisma } from "@/lib/db";
import { parseISODate, todayISO } from "@/lib/dates";

export const getActiveAcademicYear = cache(async () => {
  return prisma.academicYear.findFirst({
    where: { isActive: true },
  });
});

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

export const getClassNavContext = cache(async (classId: string) => {
  return prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      displayName: true,
      whatsappNumber: true,
      whatsappChannelUrl: true,
    },
  });
});

export const getClassById = cache(async (classId: string) => {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      academicYear: true,
      _count: { select: { students: { where: { isActive: true } } } },
    },
  });
});

export const getClassDetail = cache(async (classId: string) => {
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
});
