import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PATCH } from "./route";

const studentA = "00000000-0000-4000-8000-000000000001";
const studentB = "00000000-0000-4000-8000-000000000002";
const outsider = "00000000-0000-4000-8000-000000000003";
const context = { params: Promise.resolve({ sessionId: "test-session" }) };

test("unprepared selection validates access and membership, saves changes, and clears selections", async () => {
  const saved = new Map([[studentA, true], [studentB, false]]);
  let writes = 0;
  let sessionExists = true;
  const originalTransaction = prisma.$transaction;
  const tx = {
    attendanceSession: {
      findUnique: async () => sessionExists
        ? { records: [...saved.keys()].map((studentId) => ({ studentId })) }
        : null,
    },
    attendanceRecord: {
      updateMany: async ({ where, data }: {
        where: { sessionId: string; isUnprepared?: boolean; studentId?: { in: string[] } };
        data: { isUnprepared: boolean };
      }) => {
        assert.equal(where.sessionId, "test-session");
        writes++;
        for (const [id, selected] of saved) {
          if (where.isUnprepared !== undefined && selected !== where.isUnprepared) continue;
          if (where.studentId && !where.studentId.in.includes(id)) continue;
          saved.set(id, data.isUnprepared);
        }
      },
    },
  };
  prisma.$transaction = (async (callback: (client: typeof tx) => Promise<unknown>) =>
    callback(tx)) as unknown as typeof prisma.$transaction;
  try {
    const token = await createSessionToken();
    function request(body: unknown, authenticated = true) {
      return new NextRequest("http://localhost/api/attendance-sessions/test-session/unprepared-students", {
        method: "PATCH",
        headers: authenticated ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
        body: JSON.stringify(body),
      });
    }

    assert.equal((await PATCH(request({ student_ids: [studentB] }, false), context)).status, 401);
    assert.equal((await PATCH(request({ student_ids: ["invalid"] }), context)).status, 400);
    assert.equal((await PATCH(request({ student_ids: [studentA, studentA] }), context)).status, 400);
    assert.equal((await PATCH(request({ student_ids: [outsider] }), context)).status, 400);
    assert.equal(writes, 0);
    assert.equal(saved.get(studentA), true);

    assert.equal((await PATCH(request({ student_ids: [studentB] }), context)).status, 200);
    assert.equal(saved.get(studentA), false);
    assert.equal(saved.get(studentB), true);

    assert.equal((await PATCH(request({ student_ids: [] }), context)).status, 200);
    assert.ok([...saved.values()].every((value) => !value));

    sessionExists = false;
    assert.equal((await PATCH(request({ student_ids: [] }), context)).status, 404);
  } finally {
    prisma.$transaction = originalTransaction;
  }
});
