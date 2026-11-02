import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PUT } from "./route";

test("preparation saves without attendance and rejects foreign students or periods before writing", async () => {
  const studentId = "00000000-0000-4000-8000-000000000001";
  const classId = "00000000-0000-4000-8000-000000000002";
  const periodId = "00000000-0000-4000-8000-000000000003";
  const originalTransaction = prisma.$transaction;
  const originalClass = prisma.class.findUnique;
  const originalPeriod = prisma.timetableEntry.findFirst;
  const writes: unknown[][] = [];
  const tx = {
    student: {
      findMany: async ({ where }: { where: { classId: string; id: { in: string[] } } }) => {
        assert.equal(where.classId, classId);
        return where.id.in.filter((id) => id === studentId).map((id) => ({ id }));
      },
    },
    $executeRaw: async (_strings: TemplateStringsArray, ...values: unknown[]) => { writes.push(values); return 1; },
  };
  prisma.$transaction = (async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as unknown as typeof prisma.$transaction;
  prisma.class.findUnique = (async () => ({ id: classId })) as unknown as typeof prisma.class.findUnique;
  prisma.timetableEntry.findFirst = (async ({ where }: { where: { id: string; classId: string } }) =>
    where.id === periodId && where.classId === classId ? { id: periodId } : null) as unknown as typeof prisma.timetableEntry.findFirst;
  try {
    const token = await createSessionToken();
    const context = { params: Promise.resolve({ classId }) };
    const record = { student_id: studentId, preparation_status: "PARTIAL" };
    function request(body: unknown, auth = true) {
      return new NextRequest(`http://localhost/api/classes/${classId}/preparation`, {
        method: "PUT", body: JSON.stringify(body),
        headers: auth ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
      });
    }
    const body = { date: "2026-11-02", records: [record] };
    assert.equal((await PUT(request(body, false), context)).status, 401);
    assert.equal((await PUT(request({ ...body, records: [record, record] }), context)).status, 400);
    assert.equal((await PUT(request({ ...body, records: [{ ...record, student_id: classId }] }), context)).status, 400);
    assert.equal((await PUT(request({ ...body, timetable_entry_id: classId }), context)).status, 404);
    assert.equal(writes.length, 0);

    assert.equal((await PUT(request(body), context)).status, 200);
    assert.equal(writes[0][0], classId);
    assert.equal(writes[0][1], studentId);
    assert.equal(writes[0][3], null);
    assert.equal(writes[0][4], "PARTIAL");
    assert.equal((await PUT(request({ ...body, timetable_entry_id: periodId }), context)).status, 200);
    assert.equal(writes[1][3], periodId);
  } finally {
    prisma.$transaction = originalTransaction;
    prisma.class.findUnique = originalClass;
    prisma.timetableEntry.findFirst = originalPeriod;
  }
});
