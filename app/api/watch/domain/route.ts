import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate";

export const maxDuration = 60;

const DOMAIN_RE = /^(?!-)[a-zA-Z0-9-]{1,63}(\.[a-zA-Z0-9-]{1,63})*\.[a-zA-Z]{2,}$/;

type CrtEntry = {
  issuer_name?: unknown;
  common_name?: unknown;
  name_value?: unknown;
  not_before?: unknown;
  not_after?: unknown;
};

/**
 * CT-log viewer for domains the operator owns (or is authorized to audit).
 * Free crt.sh queried server-side with a timeout + fallback guidance, deduped
 * and compressed for the UI. No subdomain "discovery" of arbitrary targets —
 * the page requires a ownership checkbox that is logged in the UI copy.
 */
export async function GET(request: NextRequest) {
  const rl = rateLimit(`watch:${clientIp(request)}`, 10, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const domain = (request.nextUrl.searchParams.get("domain") ?? "").toLowerCase().trim();
  if (!DOMAIN_RE.test(domain) || domain.length > 100) {
    return Response.json({ error: "invalid_domain" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
      { signal: AbortSignal.timeout(40_000), cache: "no-store" },
    );
    if (res.status === 502 || res.status === 504) {
      return Response.json({ degraded: true, message: "crt.sh overloaded (chronically). Retry shortly or run again later." });
    }
    if (!res.ok) {
      return Response.json({ error: "upstream_error", status: res.status }, { status: 502 });
    }

    const raw = (await res.json()) as CrtEntry[];
    if (!Array.isArray(raw)) {
      return Response.json({ certs: [], subdomains: [], total: 0 });
    }

    const certs = raw.slice(0, 60).map((e) => ({
      issuer: typeof e.issuer_name === "string" ? e.issuer_name : "",
      commonName: typeof e.common_name === "string" ? e.common_name : "",
      names: typeof e.name_value === "string" ? e.name_value.split("\n").slice(0, 4) : [],
      notBefore: typeof e.not_before === "string" ? e.not_before.slice(0, 10) : "",
      notAfter: typeof e.not_after === "string" ? e.not_after.slice(0, 10) : "",
    }));

    const subdomainSet = new Set<string>();
    for (const e of raw) {
      const names = typeof e.name_value === "string" ? e.name_value.split("\n") : [];
      for (const n of names) {
        const clean = n.trim().toLowerCase();
        if (clean.endsWith(`.${domain}`)) {
          subdomainSet.add(clean.replace(`.${domain}`, "").split(".").pop() || clean);
        }
      }
    }
    const subdomains = Array.from(subdomainSet).sort().slice(0, 120);

    return Response.json(
      { certs, subdomains: subdomains.length ? { count: subdomainSet.size, list: subdomains } : null, total: raw.length },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return Response.json(
      { degraded: true, message: msg.includes("timeout") ? "crt.sh timed out — it happens to everyone. Try again." : "fetch failed" },
      { status: 200 },
    );
  }
}
