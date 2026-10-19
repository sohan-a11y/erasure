import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate";
import { dbEnabled, ensureSchema, getSql } from "@/lib/db";

export const maxDuration = 30;

const STATUSES = new Set(["sent", "acknowledged", "erased", "refused", "relisted"]);
const JURISDICTIONS = new Set(["ccpa", "gdpr", "us-state", "generic", "unknown"]);

/**
 * Receives CONSENTED, already-anonymized receipt events from the letters UI.
 * The client is trusted to strip identity (the export flow does). The server
 * enforces it again here: every other field is discarded.
 */
export async function POST(request: NextRequest) {
  if (!dbEnabled()) {
    return Response.json({ error: "db_disabled" }, { status: 501 });
  }

  const rl = rateLimit(`submit:${clientIp(request)}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // Optional shared secret: set SUBMIT_TOKEN to accept rows from your UI build only.
  const token = process.env.SUBMIT_TOKEN;
  if (token && request.headers.get("x-erasure-token") !== token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Strict allow-list: exactly these fields, nothing else is ever persisted.
  const brokerId = typeof body.brokerId === "string" ? body.brokerId.slice(0, 64) : "";
  const status = typeof body.status === "string" ? body.status.slice(0, 32) : "";
  const jurisdiction =
    typeof body.jurisdiction === "string" && JURISDICTIONS.has(body.jurisdiction)
      ? body.jurisdiction
      : "unknown";
  const occurredAt =
    typeof body.occurredAt === "string" && !Number.isNaN(Date.parse(body.occurredAt))
      ? new Date(body.occurredAt)
      : null;

  if (brokerId.length < 2 || brokerId === "generic-letter-route" || !STATUSES.has(status)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const sql = getSql()!;
  try {
    await ensureSchema(sql);
    await sql`
      INSERT INTO erasure_receipts (broker_id, status, jurisdiction, occurred_at)
      VALUES (${brokerId}, ${status}, ${jurisdiction}, ${occurredAt})`;
  } catch {
    return Response.json({ error: "db_error" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
