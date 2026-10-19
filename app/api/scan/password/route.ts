import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate";

/** K-anonymity range lookup: client sends only the first 5 chars of a SHA-1. */
export async function POST(request: NextRequest) {
  const rl = rateLimit(`pw:${clientIp(request)}`, 10, 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let prefix = "";
  try {
    const body = (await request.json()) as { prefix?: unknown };
    prefix = typeof body.prefix === "string" ? body.prefix.toUpperCase() : "";
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!/^[0-9A-F]{5}$/.test(prefix)) {
    return Response.json({ error: "invalid_prefix" }, { status: 400 });
  }

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
    cache: "no-store",
  });
  if (!res.ok) {
    return Response.json({ error: "upstream_error" }, { status: 502 });
  }

  const text = await res.text();
  const counts: Record<string, number> = {};
  for (const line of text.split("\n")) {
    const [hash, count] = line.trim().split(":");
    if (hash && count) counts[hash] = Number(count) || 0;
  }

  return Response.json(
    { counts },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
