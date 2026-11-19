import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

test("short results links preserve legacy tokens and reject malformed tokens", async () => {
  // These checks use database stubs and never connect to a database.
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  const { RESULT_TOKEN_PATTERN, assessmentSharingState, getParentAssessment, publishAssessmentOnFirstSave } = await import("./sharing");
  const shortToken = randomBytes(16).toString("base64url");
  const legacyToken = randomBytes(32).toString("base64url");
  for (const token of [shortToken, legacyToken]) {
    assert.ok(RESULT_TOKEN_PATTERN.test(token));
    assert.deepEqual(assessmentSharingState({ shareToken: token, sharingEnabled: true }, true), {
      path: `/r/${token}`, enabled: true, has_saved_marks: true,
    });
    let queriedToken;
    const db = { assessment: { findUnique: async (args: { where: { shareToken: string } }) => {
      queriedToken = args.where.shareToken;
      return null;
    } } } as unknown as NonNullable<Parameters<typeof getParentAssessment>[1]>;
    await getParentAssessment(token, db);
    assert.equal(queriedToken, token);
  }
  for (const token of ["", "a".repeat(21), "a".repeat(23), "a".repeat(42), "a".repeat(44), "!".repeat(22), `${shortToken}/extra`]) {
    assert.equal(RESULT_TOKEN_PATTERN.test(token), false);
    const db = { assessment: { findUnique: () => assert.fail("Invalid tokens must not query the database") } } as unknown as NonNullable<Parameters<typeof getParentAssessment>[1]>;
    assert.equal(await getParentAssessment(token, db), null);
  }
  const tokens: string[] = [];
  const tx = { assessment: { updateMany: async (args: { where: { id: string; shareToken: null }; data: { shareToken: string } }) => {
    assert.deepEqual(args.where, { id: "assessment", shareToken: null });
    assert.match(args.data.shareToken, /^[A-Za-z0-9_-]{22}$/);
    tokens.push(args.data.shareToken);
  } } } as unknown as Parameters<typeof publishAssessmentOnFirstSave>[0];
  await publishAssessmentOnFirstSave(tx, "assessment");
  await publishAssessmentOnFirstSave(tx, "assessment");
  assert.notEqual(tokens[0], tokens[1]);
});

test("short and legacy result pages stay public with privacy headers; nested paths stay protected", async () => {
  for (const prefix of ["r", "results"]) {
    for (const length of [22, 43]) {
      const response = await proxy(new NextRequest(`https://example.com/${prefix}/${"a".repeat(length)}`));
      assert.equal(response.headers.get("x-middleware-next"), "1");
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
      assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    }
    assert.equal((await proxy(new NextRequest(`https://example.com/${prefix}/token/other`))).status, 307);
  }
});
