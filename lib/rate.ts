/**
 * Minimal in-memory rate limiter for serverless functions.
 *
 * NOTE: on serverless, memory resets per warm instance. This is a best-effort
 * guard against drive-by abuse, not a production wall. For real traffic limits
 * plug in Upstash Redis (env-based) — see docs/ROADMAP.md.
 */

type Bucket = { hits: number[]; };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= max) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (b.hits.length === 0 || now - b.hits[b.hits.length - 1] > windowMs * 4) {
        buckets.delete(k);
      }
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
