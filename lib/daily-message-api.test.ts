import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { GET } from "@/app/api/attendance-sessions/[sessionId]/whatsapp-message/route";
const date = new Date("2026-11-15T00:00:00Z");
test("message endpoint scopes daily sessions, preserves daily unmarked preparation, and links each missing diary", async () => {
  const saved = { anchor: prisma.attendanceSession.findUnique, sessions: prisma.attendanceSession.findMany,
    students: prisma.student.findMany, preparation: prisma.studentPreparation.findMany, setting: prisma.appSetting.findUnique, settings: prisma.appSetting.findMany };
  let missingAnchor = false;
  let sessionCount = 2;
  try {
    prisma.attendanceSession.findUnique = (async () => missingAnchor ? null : ({ classId: "class", attendanceDate: date, class: { displayName: "10 A", whatsappChannelUrl: "https://example.com/materials", whatsappNumber: "919999999999" } })) as unknown as typeof prisma.attendanceSession.findUnique;
    prisma.attendanceSession.findMany = (async (args: { where: { classId: string; attendanceDate: unknown }; include: { teachingDiaryEntries?: { take: number; orderBy: object[] } }; orderBy?: object[] }) => {
      assert.equal(args.where.classId, "class");
      if (!args.include.teachingDiaryEntries) return [];
      assert.equal(args.where.attendanceDate, date); assert.equal(args.include.teachingDiaryEntries.take, 1);
      assert.deepEqual(args.include.teachingDiaryEntries.orderBy, [{ updatedAt: "desc" }, { id: "desc" }]);
      assert.deepEqual(args.orderBy, [{ startTime: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }, { id: "asc" }]);
      return ["one", "two"].slice(0, sessionCount).map((id, i) => ({ id, subject: "Maths", startTime: i ? null : "09:00", endTime: i ? null : "10:00", teachingDiaryEntries: [], records: [] }));
    }) as unknown as typeof prisma.attendanceSession.findMany;
    prisma.student.findMany = (async () => [{ id: "student", rollNo: 1, fullName: "Arun" }]) as unknown as typeof prisma.student.findMany;
    prisma.studentPreparation.findMany = (async ({ where }: { where: { timetableEntryId: null } }) => {
      assert.equal(where.timetableEntryId, null); return [];
    }) as unknown as typeof prisma.studentPreparation.findMany;
    prisma.appSetting.findUnique = (async () => ({ value: "919999999999" })) as unknown as typeof prisma.appSetting.findUnique;
    prisma.appSetting.findMany = (async () => []) as unknown as typeof prisma.appSetting.findMany;
    const cookie = `${SESSION_COOKIE}=${await createSessionToken()}`;
    const get = (query = "", authenticated = true) => GET(new NextRequest(`http://localhost/api/attendance-sessions/one/whatsapp-message${query}`, { headers: authenticated ? { cookie } : {} }), { params: Promise.resolve({ sessionId: "one" }) });
    assert.equal((await get("", false)).status, 401);
    const response = await get(); const body = await response.json();
    assert.equal(response.status, 200); assert.equal(body.session_count, 2);
    assert.match(body.message, /DAILY CLASS UPDATE/); assert.match(body.message, /Attendance not recorded/);
    assert.equal(body.missing_items.length, 2);
    assert.ok(body.missing_items[0].fix_href.includes("session_id=one")); assert.ok(body.missing_items[1].fix_href.includes("session_id=two"));
    const separate = await (await get("?template=separate")).json();
    assert.equal(separate.timetable_entry_id, null); assert.equal(separate.students[0].preparation_status, "NOT_MARKED");
    assert.match(separate.message, /Preparation not marked/); assert.doesNotMatch(separate.message, /SESSION 1/);
    assert.doesNotMatch(separate.message, /\*SUBJECTS?:\*|\*SESSION:\*|\*CHAPTER:\*|\*TOPICS:\*|\*ABSENTEES\*|\*LATE STUDENTS\*/);
    assert.match(separate.message, /\*CLASS:\* 10 A\n\*DATE:\* 15 Nov 2026\n\*HW:\* No homework assigned\./);
    sessionCount = 1;
    assert.match((await (await get()).json()).message, /^Class Update - 10 A/);
    missingAnchor = true; assert.equal((await get()).status, 404);
  } finally {
    prisma.attendanceSession.findUnique = saved.anchor; prisma.attendanceSession.findMany = saved.sessions;
    prisma.student.findMany = saved.students; prisma.studentPreparation.findMany = saved.preparation;
    prisma.appSetting.findUnique = saved.setting; prisma.appSetting.findMany = saved.settings;
  }
});
