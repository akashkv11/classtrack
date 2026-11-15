import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { GET, POST } from "./route";
const classId = "10000000-0000-4000-8000-000000000001";
const sessionId = "10000000-0000-4000-8000-000000000002";
const studentId = "10000000-0000-4000-8000-000000000003";
const context = { params: Promise.resolve({ classId }) };

test("attendance API uses explicit session IDs and rejects invalid ownership and missing extra-session details", async () => {
  const originals = {
    students: prisma.student.findMany,
    session: prisma.attendanceSession.findFirst,
    sessions: prisma.attendanceSession.findMany,
  };
  let found = true;
  try {
    prisma.student.findMany = (async () => [{ id: studentId, rollNo: 1, fullName: "Student" }]) as typeof prisma.student.findMany;
    prisma.attendanceSession.findFirst = (async ({ where }: { where: { id: string; classId: string; attendanceDate: Date } }) => {
      assert.equal(where.id, sessionId);
      assert.equal(where.classId, classId);
      assert.equal(where.attendanceDate.toISOString().slice(0, 10), "2026-11-15");
      return found ? { id: sessionId, classId, timetableEntryId: null, subject: "Maths", startTime: "09:00", endTime: "10:00", records: [{ studentId, status: "present" }] } : null;
    }) as unknown as typeof prisma.attendanceSession.findFirst;
    prisma.attendanceSession.findMany = (async () => []) as unknown as typeof prisma.attendanceSession.findMany;
    const cookie = `${SESSION_COOKIE}=${await createSessionToken()}`;
    const get = () => GET(new NextRequest(`http://localhost/api/classes/${classId}/attendance?date=2026-11-15&session_id=${sessionId}`, { headers: { cookie } }), context);
    const response = await get();
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.session.id, sessionId);
    assert.equal(body.session.subject, "Maths");
    assert.equal(body.records[0].status, "present");
    found = false;
    assert.equal((await get()).status, 404);
    const post = (payload: object) => POST(new NextRequest(`http://localhost/api/classes/${classId}/attendance`, {
      method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }), context);
    const payload = { attendance_date: "2026-11-15", records: [{ student_id: studentId, status: "present" }] };
    assert.equal((await post(payload)).status, 400);
    assert.equal((await post({ ...payload, session_id: sessionId })).status, 404);
  } finally {
    prisma.student.findMany = originals.students;
    prisma.attendanceSession.findFirst = originals.session;
    prisma.attendanceSession.findMany = originals.sessions;
  }
});
