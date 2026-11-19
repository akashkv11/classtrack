import { isIP } from "node:net";

const pending = new Map<string, Promise<string>>();
let retryAfter = 0;

export function canShortenResultsUrl(value: string): boolean {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  return ["https:", "http:"].includes(url.protocol) && host.includes(".") &&
    !isIP(host) && !host.endsWith(".localhost") && !host.endsWith(".local");
}

// https://is.gd/apishorteningreference.php
// Persist successful results on the assessment; deduplicate simultaneous requests.
export async function shortenResultsUrl(target: string): Promise<string> {
  if (!canShortenResultsUrl(target)) throw new Error("A public site URL is required.");
  const existing = pending.get(target);
  if (existing) return existing;
  if (Date.now() < retryAfter || pending.size >= 5) throw new Error("Shortening is temporarily unavailable.");
  const task = (async () => {
    const response = await fetch("https://is.gd/create.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ format: "json", url: target }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      redirect: "error",
    });
    const data = await response.json();
    if (data?.errorcode === 3 || response.status === 429 || response.status === 502) retryAfter = Date.now() + 60_000;
    if (!response.ok || data?.errorcode || typeof data?.shorturl !== "string" ||
      !/^https:\/\/is\.gd\/[A-Za-z0-9_]{5,30}$/.test(data.shorturl)) {
      throw new Error("Could not shorten the results link.");
    }
    return data.shorturl as string;
  })();
  pending.set(target, task);
  try { return await task; }
  finally { pending.delete(target); }
}
