import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { GET } from "@/app/api/classes/[classId]/reports/student-profile/route";
import { getStudentProfileReports } from "./student-profile-report";
const classId = "10000000-0000-4000-8000-000000000001";
const studentId = "10000000-0000-4000-8000-000000000002";
const inactiveId = "10000000-0000-4000-8000-000000000003";
const date = new Date("2026-11-15T00:00:00Z");
test("report batches all students, contains full histories, and excludes staff fields", async () => {
  const originals = { cls: prisma.class.findUnique, students: prisma.student.findMany, sessions: prisma.attendanceSession.findMany,
    marks: prisma.assessmentMark.findMany, preparation: prisma.studentPreparation.findMany, setting: prisma.appSetting.findUnique };
  let queries = 0;
  try {
    prisma.class.findUnique = (async ({ where }: { where: { id: string } }) => where.id === classId ? { id: classId, displayName: "10 A", academicYear: { name: "2026–27" } } : null) as unknown as typeof prisma.class.findUnique;
    prisma.student.findMany = (async ({ where }: { where: { id?: string; classId: string } }) => {
      queries++; assert.equal(where.classId, classId);
      return [{ id: studentId, rollNo: 1, fullName: "Arun", admissionNo: null, email: null, parentPhone: "1234567890", isActive: true },
        { id: inactiveId, rollNo: 2, fullName: "Meera", isActive: false }].filter(s => !where.id || s.id === where.id);
    }) as unknown as typeof prisma.student.findMany;
    prisma.attendanceSession.findMany = (async ({ where, select }: { where: { classId: string }; select: object }) => {
      queries++; assert.equal(where.classId, classId); assert.doesNotMatch(JSON.stringify(select), /remarks|notes/);
      return ["one", "two", "three"].map((id, i) => ({ id, attendanceDate: date, subject: "Maths", startTime: i ? "14:00" : "09:00", endTime: i ? "15:00" : "10:00",
        records: i === 2 ? [] : [{ studentId, status: i ? "late" : "present" }] }));
    }) as unknown as typeof prisma.attendanceSession.findMany;
    prisma.assessmentMark.findMany = (async ({ select }: { select: object }) => {
      queries++; assert.doesNotMatch(JSON.stringify(select), /remarks/);
      return [{ studentId, marksObtained: 8, remarks: "INTERNAL", assessment: { id: "exam", name: "Test", assessmentDate: date, assessmentType: "CHAPTER_TEST", maxMarks: 10, syllabusSubject: { subjectName: "Maths" } } }];
    }) as unknown as typeof prisma.assessmentMark.findMany;
    prisma.studentPreparation.findMany = (async ({ where, select }: { where: object; select: object }) => {
      queries++; assert.doesNotMatch(JSON.stringify(where), /status/); assert.doesNotMatch(JSON.stringify(select), /note/);
      return ["FULL", "PARTIAL", "NONE", "NOT_MARKED"].map((status, i) => ({ id: String(i), studentId, preparationDate: date, timetableEntryId: null, timetableEntry: null, status, note: "INTERNAL" }));
    }) as unknown as typeof prisma.studentPreparation.findMany;
    prisma.appSetting.findUnique = (async () => ({ value: "true" })) as unknown as typeof prisma.appSetting.findUnique;
    const profiles = await getStudentProfileReports(classId);
    assert.ok(profiles); assert.equal(profiles.length, 2); assert.equal(queries, 4);
    assert.equal(profiles[1].student.is_active, false); assert.equal(profiles[0].attendance.length, 3);
    assert.deepEqual(profiles[0].attendance.map(a => a.status), ["present", "late", "not_marked"]);
    assert.equal(profiles[0].summary.attendance_percentage, 66.7);
    assert.equal(profiles[0].preparation.length, 4); assert.equal(profiles[0].summary.average_marks_percentage, 80);
    assert.doesNotMatch(JSON.stringify(profiles), /INTERNAL|remarks|automatic_note/);
    assert.deepEqual(profiles[1].assessments, []);
    const cookie = `${SESSION_COOKIE}=${await createSessionToken()}`;
    const request = (query: string, cls = classId) => GET(new NextRequest(`http://localhost/api/classes/${cls}/reports/student-profile?${query}`, { headers: { cookie } }), { params: Promise.resolve({ classId: cls }) });
    for (const query of ["", `student_id=${studentId}&all_students=true`, "all_students=false", "student_id=invalid"]) assert.equal((await request(query)).status, 400);
    assert.equal((await request("all_students=true", "missing")).status, 404);
    assert.equal((await request("student_id=10000000-0000-4000-8000-000000000009")).status, 404);
    assert.equal((await request("all_students=true")).status, 200);
    assert.equal((await (await request(`student_id=${studentId}`)).json()).profiles.length, 1);
  } finally {
    prisma.class.findUnique = originals.cls; prisma.student.findMany = originals.students; prisma.attendanceSession.findMany = originals.sessions;
    prisma.assessmentMark.findMany = originals.marks; prisma.studentPreparation.findMany = originals.preparation; prisma.appSetting.findUnique = originals.setting;
  }
});
