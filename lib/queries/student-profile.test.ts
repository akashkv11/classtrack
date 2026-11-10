import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/db";
import { getStudentMonthlyAttendance, getStudentOverallAttendance } from "./student-profile";

test("overall student attendance spans months while monthly filtering and late-count rules still work", async () => {
  const originalStudent = prisma.student.findFirst;
  const originalSessions = prisma.attendanceSession.findMany;
  const originalSetting = prisma.appSetting.findUnique;
  let lateAsPresent = true;
  let sessionQueries = 0;
  const sessions = [
    { id: "before-enrolment", date: "2026-01-01", studentId: "other", status: "present" },
    { id: "january", date: "2026-01-31", studentId: "student", status: "present" },
    { id: "february-period-1", date: "2026-02-01", studentId: "student", status: "late" },
    { id: "february-period-2", date: "2026-02-01", studentId: "student", status: "absent" },
    { id: "february-2", date: "2026-02-02", studentId: "student", status: "present" },
  ];
  prisma.student.findFirst = (async ({ where }: { where: { id: string; classId: string } }) =>
    where.id === "student" && where.classId === "class" ? { id: "student" } : null) as unknown as typeof prisma.student.findFirst;
  prisma.appSetting.findUnique = (async () => ({ value: String(lateAsPresent) })) as unknown as typeof prisma.appSetting.findUnique;
  prisma.attendanceSession.findMany = (async (args: {
    where: { classId: string; attendanceDate?: { gte: Date; lte: Date }; records?: { some: { studentId: string } } };
    include: { records: { where: { studentId: string } } };
  }) => {
    sessionQueries++;
    assert.equal(args.where.classId, "class");
    return sessions.filter((session) => {
      const date = new Date(`${session.date}T00:00:00Z`);
      if (args.where.attendanceDate && (date < args.where.attendanceDate.gte || date > args.where.attendanceDate.lte)) return false;
      if (args.where.records && session.studentId !== args.where.records.some.studentId) return false;
      return true;
    }).map((session) => ({
      id: session.id,
      attendanceDate: new Date(`${session.date}T00:00:00Z`),
      timetableEntry: null,
      records: session.studentId === args.include.records.where.studentId
        ? [{ status: session.status, remarks: null }] : [],
    }));
  }) as unknown as typeof prisma.attendanceSession.findMany;
  try {
    const overall = await getStudentOverallAttendance("class", "student");
    assert.ok(overall);
    assert.equal(overall.working_days, 4);
    assert.equal(overall.present_days, 2);
    assert.equal(overall.absent_days, 1);
    assert.equal(overall.late_days, 1);
    assert.equal(overall.attendance_percentage, 75);
    assert.deepEqual(overall.records.map((record) => record.session_id), ["january", "february-period-1", "february-period-2", "february-2"]);

    const february = await getStudentMonthlyAttendance("class", "student", "2026-02");
    assert.ok(february);
    assert.equal(february.month, "2026-02");
    assert.equal(february.working_days, 3);
    assert.equal(february.attendance_percentage, 66.7);
    assert.equal(february.records.every((record) => record.attendance_date.startsWith("2026-02")), true);

    lateAsPresent = false;
    assert.equal((await getStudentOverallAttendance("class", "student"))?.attendance_percentage, 50);
    const emptyMonth = await getStudentMonthlyAttendance("class", "student", "2026-03");
    assert.equal(emptyMonth?.working_days, 0);
    assert.equal(emptyMonth?.attendance_percentage, 0);

    const before = sessionQueries;
    assert.equal(await getStudentOverallAttendance("different-class", "student"), null);
    assert.equal(await getStudentMonthlyAttendance("class", "student", "2026-13"), null);
    assert.equal(sessionQueries, before);
  } finally {
    prisma.student.findFirst = originalStudent;
    prisma.attendanceSession.findMany = originalSessions;
    prisma.appSetting.findUnique = originalSetting;
  }
});
