import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate";

export const maxDuration = 30;

const EMAIL_RE = /^[^@\s]{1,64}@[^@\s]{1,255}\.[^@\s]{2,}$/;

type HibpBreach = {
  name?: unknown;
  title?: unknown;
  breachdate?: unknown;
  dataclasses?: unknown;
  domain?: unknown;
};

/**
 * Email breach lookup via Have I Been Pwned (v3).
 * Requires an operator-supplied HIBP_KEY env var — HIBP makes this endpoint
 * key-gated (free tier: manual website only). Without a key we return a
 * `needsKey` payload so the UI can guide the user instead of lying.
 */
export async function GET(request: NextRequest) {
  const rl = rateLimit(`hibp:${clientIp(request)}`, 5, 5 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const email = request.nextUrl.searchParams.get("email") ?? "";
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const key = process.env.HIBP_KEY;
  if (!key) {
    return Response.json({
      needsKey: true,
      manualCheckUrl: "https://haveibeenpwned.com/",
      howTo:
        "Deploy with a free-style HIBP API key (haveibeenpwned.com/API/Key) as HIBP_KEY env var on your Vercel project — then this module lights up for everyone.",
    });
  }

  const res = await fetch(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
    {
      headers: { "hibp-api-key": key, "User-Agent": "erasure-osint/0.9" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (res.status === 404) {
    return Response.json({ breaches: [], scanned: true });
  }
  if (res.status === 401 || res.status === 403) {
    return Response.json({ needsKey: true, invalidKey: true }, { status: 502 });
  }
  if (!res.ok) {
    return Response.json({ error: "upstream_error", status: res.status }, { status: 502 });
  }

  const raw = (await res.json()) as HibpBreach[];
  const breaches = Array.isArray(raw)
    ? raw.slice(0, 50).map((b) => ({
        name: String(b.name ?? ""),
        title: String(b.title ?? b.name ?? ""),
        breachDate: String(b.breachdate ?? ""),
        dataClasses: Array.isArray(b.dataclasses) ? b.dataclasses.map(String).slice(0, 12) : [],
        domain: String(b.domain ?? ""),
      }))
    : [];

  return Response.json({ breaches, scanned: true });
}
