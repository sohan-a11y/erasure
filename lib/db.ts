import postgres from "postgres";

/**
 * Optional Phase-2 storage (the only place Erasure ever persists anything —
 * and only anonymized receipt events, never identities).
 *
 * Enabled purely by the presence of POSTGRES_URL. Without it, everything
 * degrades to zero-config mode: reports/letters live in the browser and the
 * Compliance Index shows seeded public evidence only.
 */

let _sql: postgres.Sql | null = null;
let _initPromise: Promise<void> | null = null;

export function getSql(): postgres.Sql | null {
  const url = process.env.POSTGRES_URL;
  if (!url) return null;
  if (_sql) return _sql;
  _sql = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
  return _sql;
}

export function dbEnabled(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

/** Idempotent: creates the single receipts table on first use. */
export async function ensureSchema(sql: postgres.Sql): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS erasure_receipts (
        id          BIGSERIAL PRIMARY KEY,
        broker_id   TEXT NOT NULL,
        status      TEXT NOT NULL,
        jurisdiction TEXT NOT NULL DEFAULT 'unknown',
        occurred_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS erasure_receipts_broker_idx ON erasure_receipts (broker_id)`;
  })().catch((err) => {
    _initPromise = null;
    throw err;
  });
  await _initPromise;
}
