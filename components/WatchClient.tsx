"use client";

import { useState } from "react";
import { Button, Panel } from "@/components/ui";

type CertRow = {
  issuer: string;
  commonName: string;
  names: string[];
  notBefore: string;
  notAfter: string;
};

type WatchResponse = {
  certs?: CertRow[];
  subdomains?: { count: number; list: string[] } | null;
  total?: number;
  degraded?: boolean;
  message?: string;
};

export default function WatchClient() {
  const [domain, setDomain] = useState("");
  const [own, setOwn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!own || !domain) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`/api/watch/domain?domain=${encodeURIComponent(domain.trim().toLowerCase())}`);
      const data = (await resp.json()) as WatchResponse;
      if (data.degraded) {
        setError(data.message ?? "crt.sh degraded — try again in a minute.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Request failed — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Panel title="Certificate Transparency lookups" sub="New HTTPS certificates for a domain are public within hours — for YOUR domains this is a free change-detection feed (the crt.sh replacement, as a tab).">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-sky-500" />
          <span>I own this domain or am authorized to audit it. This feature is not for enumerating other parties&apos; domains.</span>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
          />
          <Button onClick={run} disabled={!own || !domain || loading}>
            {loading ? "querying crt.sh…" : "Check CT logs"}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-amber-400">{error}</p> : null}
      </Panel>

      {result?.subdomains ? (
        <Panel title={`Hostnames — ${result.subdomains.count} distinct under this domain`} sub="Free tier of the paid 'attack-surface monitoring' products: watch these for changes over time.">
          <div className="flex flex-wrap gap-1.5">
            {result.subdomains.list.map((s) => (
              <span key={s} className="rounded-md bg-black/40 px-2 py-1 font-mono text-xs text-slate-300">
                {s}
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      {result?.certs ? (
        <Panel title={`Certificate log — ${result.certs.length} of ${result.total ?? "?"}`} sub="Issuers, SANs, and validity windows. A sudden new issuer or cert for a name you don't manage = investigate.">
          <div className="grid gap-2">
            {result.certs.map((c, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-slate-300">
                <div className="font-mono text-slate-200">{c.commonName || c.names[0] || "—"}</div>
                <div className="mt-1 text-slate-500">
                  {c.issuer} · {c.notBefore} → {c.notAfter}
                </div>
                {c.names.length > 1 ? (
                  <div className="mt-1 font-mono text-[11px] text-slate-400">{c.names.join(" · ")}</div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
