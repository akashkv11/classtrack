import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

test("share URL endpoint authenticates and always returns direct links without calling a shortener", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  const { prisma } = await import("@/lib/db");
  const { POST } = await import("./route");
  const assessmentId = "00000000-0000-4000-8000-000000000001";
  const classId = "00000000-0000-4000-8000-000000000002";
  const cookie = `${SESSION_COOKIE}=${await createSessionToken()}`;
  const context = { params: Promise.resolve({ assessmentId }) };
  const request = (auth = true, origin = "https://school.example.com", query = classId) => new NextRequest(`${origin}/api/assessments/${assessmentId}/share-url?class_id=${query}`, {
    method: "POST", headers: auth ? { cookie } : {},
  });
  let row: { classId: string; shareToken: string | null; sharingEnabled: boolean; shareShortUrl: string; shareShortTarget: string } | null = {
    classId, shareToken: "a".repeat(22), sharingEnabled: true,
    shareShortUrl: "https://is.gd/Old123", shareShortTarget: `https://school.example.com/r/${"a".repeat(22)}`,
  };
  const originalFind = prisma.assessment.findUnique;
  const originalUpdate = prisma.assessment.updateMany;
  const originalFetch = globalThis.fetch;
  prisma.assessment.findUnique = (async () => row) as unknown as typeof originalFind;
  prisma.assessment.updateMany = (async () => assert.fail("Direct sharing must not write a shortened URL")) as unknown as typeof originalUpdate;
  globalThis.fetch = async () => assert.fail("Direct sharing must not contact a URL shortener");
  try {
    assert.equal((await POST(request(false), context)).status, 401);
    assert.equal((await POST(request(true, undefined, "bad"), context)).status, 400);
    assert.equal((await POST(request(true, undefined, assessmentId), context)).status, 403);
    row.sharingEnabled = false;
    assert.equal((await POST(request(), context)).status, 409);
    row.sharingEnabled = true;
    for (const origin of ["https://school.example.com", "http://localhost:3000"]) {
      const response = await POST(request(true, origin), context);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      assert.deepEqual(await response.json(), { path: `/r/${row.shareToken}`, url: `${origin}/r/${row.shareToken}`, shortened: false });
    }
    row.shareToken = "b".repeat(22);
    assert.equal((await (await POST(request(), context)).json()).url, `https://school.example.com/r/${row.shareToken}`);
    row.shareToken = null;
    assert.equal((await POST(request(), context)).status, 409);
    row = null;
    assert.equal((await POST(request(), context)).status, 404);
  } finally {
    prisma.assessment.findUnique = originalFind;
    prisma.assessment.updateMany = originalUpdate;
    globalThis.fetch = originalFetch;
  }
});
