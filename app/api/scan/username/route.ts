import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate";
import { getProbeList, probeChunk } from "@/lib/scans/usernames";

export const maxDuration = 60;

const MAX_CHUNK = 40;
const PER_IP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  // each chunk = up to MAX_CHUNK outbound probes; allow 12 chunks (480 sites) / 10 min / IP
  const rl = rateLimit(`chunk:${ip}`, 12, PER_IP_WINDOW_MS);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: { account?: unknown; from?: unknown; size?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const account = typeof body.account === "string" ? body.account.trim() : "";
  const from = Math.max(0, Number(body.from) || 0);
  const size = Math.min(MAX_CHUNK, Math.max(1, Number(body.size) || MAX_CHUNK));

  if (!account || account.length > 80) {
    return Response.json({ error: "invalid_account" }, { status: 400 });
  }

  const { list, source } = await getProbeList();
  const slice = list.slice(from, from + size);
  if (slice.length === 0) {
    return Response.json({ results: [], from, total: list.length, done: true, source });
  }

  const results = await probeChunk(slice, account);
  return Response.json({
    results,
    from: from + slice.length,
    total: list.length,
    done: from + slice.length >= list.length,
    source,
  });
}
