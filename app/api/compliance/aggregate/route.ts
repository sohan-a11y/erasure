import { clientIp, rateLimit } from "@/lib/rate";
import { dbEnabled, ensureSchema, getSql } from "@/lib/db";

export const maxDuration = 30;

type Row = {
  broker_id: string;
  total: number;
  sent: number;
  erased: number;
  refused: number;
  relisted: number;
  acknowledged: number;
};

export async function GET(request: Request) {
  const rl = rateLimit(`agg:${clientIp(request) ?? new URL(request.url).hostname}`, 30, 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (!dbEnabled()) {
    return Response.json({ enabled: false });
  }

  const sql = getSql()!;
  try {
    await ensureSchema(sql);
    const rows = (await sql`
      SELECT
        broker_id,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
        COUNT(*) FILTER (WHERE status = 'erased')::int AS erased,
        COUNT(*) FILTER (WHERE status = 'refused')::int AS refused,
        COUNT(*) FILTER (WHERE status = 'relisted')::int AS relisted,
        COUNT(*) FILTER (WHERE status = 'acknowledged')::int AS acknowledged
      FROM erasure_receipts
      GROUP BY broker_id
      ORDER BY relisted DESC, refused DESC, total DESC
      LIMIT 50`) as unknown as Row[];

    return Response.json(
      {
        enabled: true,
        rows: rows.map((r) => ({
          brokerId: r.broker_id,
          total: r.total,
          sent: r.sent,
          erased: r.erased,
          acknowledged: r.acknowledged,
          refused: r.refused,
          relisted: r.relisted,
        })),
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
    );
  } catch {
    return Response.json({ error: "db_error" }, { status: 502 });
  }
}
