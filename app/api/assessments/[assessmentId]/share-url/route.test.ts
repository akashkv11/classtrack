import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

test("share URL endpoint authenticates, reuses saved links, handles regeneration and falls back on service failure", async () => {
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
  let row: { classId: string; shareToken: string | null; sharingEnabled: boolean; shareShortUrl: string | null; shareShortTarget: string | null } | null = {
    classId, shareToken: "a".repeat(22), sharingEnabled: true, shareShortUrl: null, shareShortTarget: null,
  };
  const originalFind = prisma.assessment.findUnique;
  const originalUpdate = prisma.assessment.updateMany;
  const originalFetch = globalThis.fetch;
  let providerCalls = 0;
  let writes = 0;
  let updateCount = 1;
  let providerFailed = false;
  prisma.assessment.findUnique = (async () => row) as unknown as typeof originalFind;
  prisma.assessment.updateMany = (async ({ where, data }: { where: { shareToken: string; sharingEnabled: boolean }; data: { shareShortUrl: string; shareShortTarget: string } }) => {
    writes++;
    assert.equal(where.shareToken, row?.shareToken);
    assert.equal(where.sharingEnabled, true);
    if (updateCount && row) Object.assign(row, data);
    return { count: updateCount };
  }) as unknown as typeof originalUpdate;
  globalThis.fetch = async (_input, init) => {
    providerCalls++;
    assert.equal((init?.body as URLSearchParams).get("url"), `https://school.example.com/r/${row?.shareToken}`);
    if (providerFailed) throw new Error("Unavailable");
    return Response.json({ shorturl: `https://is.gd/Ab123${providerCalls}` });
  };
  try {
    assert.equal((await POST(request(false), context)).status, 401);
    assert.equal((await POST(request(true, undefined, "bad"), context)).status, 400);
    assert.equal((await POST(request(true, undefined, assessmentId), context)).status, 403);
    row.sharingEnabled = false;
    assert.equal((await POST(request(), context)).status, 409);
    row.sharingEnabled = true;
    assert.equal(providerCalls, 0);
    const first = await POST(request(), context);
    assert.match(first.headers.get("cache-control") ?? "", /no-store/);
    assert.deepEqual(await first.json(), { path: `/r/${row.shareToken}`, url: "https://is.gd/Ab1231", shortened: true });
    assert.equal(writes, 1);
    assert.equal((await (await POST(request(), context)).json()).url, "https://is.gd/Ab1231");
    assert.equal(providerCalls, 1, "Saved links are reused without contacting the provider");
    row.shareToken = "b".repeat(22);
    assert.equal((await (await POST(request(), context)).json()).url, "https://is.gd/Ab1232");
    assert.equal(providerCalls, 2, "Regeneration never reuses the previous short link");
    row.shareToken = "c".repeat(22);
    providerFailed = true;
    const fallback = await (await POST(request(), context)).json();
    assert.equal(fallback.shortened, false);
    assert.equal(fallback.url, `https://school.example.com/r/${row.shareToken}`);
    assert.ok(fallback.warning);
    assert.equal(writes, 2);
    providerFailed = false;
    updateCount = 0;
    assert.equal((await POST(request(), context)).status, 409, "Concurrent disable/regeneration rejects a stale URL");
    const before = providerCalls;
    const local = await (await POST(request(true, "http://localhost:3000"), context)).json();
    assert.equal(local.shortened, false);
    assert.equal(providerCalls, before);
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
