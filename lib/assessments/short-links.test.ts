import assert from "node:assert/strict";
import test from "node:test";
import { canShortenResultsUrl, shortenResultsUrl } from "./short-links";

test("shortener encodes destinations, validates responses, deduplicates calls and handles failures", async () => {
  for (const host of ["localhost", "test.localhost", "10.0.0.1", "127.0.0.1", "[::1]", "school.local"]) {
    assert.equal(canShortenResultsUrl(`http://${host}/r/token`), false);
  }
  assert.ok(canShortenResultsUrl("https://school.example.com/r/token"));
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    const target = "https://school.example.com/r/token?name=a&other=b";
    globalThis.fetch = async (input, init) => {
      calls++;
      assert.equal(input, "https://is.gd/create.php");
      assert.equal(init?.method, "POST");
      assert.equal((init?.body as URLSearchParams).get("url"), target);
      assert.equal((init?.body as URLSearchParams).get("format"), "json");
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal);
      return Response.json({ shorturl: "https://is.gd/Ab123Z" });
    };
    assert.deepEqual(await Promise.all([shortenResultsUrl(target), shortenResultsUrl(target)]), ["https://is.gd/Ab123Z", "https://is.gd/Ab123Z"]);
    assert.equal(calls, 1);
    for (const data of [{}, { errorcode: 1 }, { shorturl: "https://evil.example/abc123" }, { shorturl: "http://is.gd/abc123" }]) {
      globalThis.fetch = async () => Response.json(data);
      await assert.rejects(shortenResultsUrl(target));
    }
    globalThis.fetch = async () => { throw new DOMException("Timed out", "TimeoutError"); };
    await assert.rejects(shortenResultsUrl(target));
    globalThis.fetch = async () => Response.json({ errorcode: 3 }, { status: 502 });
    await assert.rejects(shortenResultsUrl(target));
    globalThis.fetch = async () => assert.fail("Rate limited requests must back off");
    await assert.rejects(shortenResultsUrl(target), /temporarily unavailable/);
  } finally { globalThis.fetch = originalFetch; }
});
