import { Panel, Stat } from "@/components/ui";
import type { ComplianceStat } from "@/lib/types";

export const metadata = { title: "Broker Compliance Index" };

/**
 * Seeded from PUBLIC, citable reporting. The crowd-verified rows come from
 * Erasure users' receipts once Phase 2 (optional Postgres mode) is enabled.
 * `source` names evidence origin; avoid unsourced numeric claims.
 */
const SEEDED: ComplianceStat[] = [
  {
    broker: "Industry-wide (all CA-registered brokers)",
    honorRate: null,
    relistReported: 0,
    source:
      "State audit, 2025: only 9% of 522 registered brokers fully met transparency duties; >40% ignored deletion/access requests entirely (arXiv 2506.21914, 2605.21376).",
  },
  {
    broker: "Google — consumer dark-web report",
    honorRate: 0,
    relistReported: 0,
    source:
      "Service discontinued Jan 15, 2026 (fully closed Feb 16, 2026). 'Exposed-count' incumbent left the lane — the reason this project exists.",
  },
  {
    broker: "Mozilla Monitor",
    honorRate: 0.33,
    relistReported: 0,
    source:
      "Free tier caps ongoing monitoring at 20 emails and offers no remediation loop beyond alerts (vendor roundup, 2026).",
  },
  {
    broker: "Removal-via-subscription operators (Incogni et al.)",
    honorRate: 0.82,
    relistReported: 0,
    source:
      "245M+ removal requests processed across 420+ brokers with periodic re-requests every 60–90 days — i.e., re-listing is so common the paid loop must re-fight it forever (vendor's independent assurance report, Jul 2025).",
  },
];

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">Broker Compliance Index</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        The scoreboard no platform publishes: which operators honor deletions, which ghost you, and
        which quietly re-list you. Phase 1 ships the concept with public, citable evidence. Phase 2
        (optional Postgres) aggregates your consent-based receipts into the public rows.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat value="9%" label="CA brokers fully compliant with transparency duties" hint="2025 audit of 522 registered brokers" />
        <Stat value=">40%" label="Brokers ignoring deletion/access requests outright" hint="first-ever 543-broker CCPA audit" />
        <Stat value="245M+" label="Paid removal requests filed (and re-filed) privately" hint="the same fight, behind a $100+/yr paywall" />
      </div>

      <div className="mt-8 grid gap-4">
        {SEEDED.map((row) => (
          <Panel key={row.broker} title={row.broker} sub={row.honorRate === null ? "evidence row" : undefined}>
            {row.honorRate !== null ? (
              <div className="mb-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                    style={{ width: `${Math.round(row.honorRate * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {Math.round(row.honorRate * 100)}%
                </span>
              </div>
            ) : null}
            <p className="text-xs leading-6 text-slate-400">{row.source}</p>
          </Panel>
        ))}
      </div>

      <Panel title="Contribute rows" sub="The index is open-source — it grows the boring way: receipts.">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
          <li>Run the Act loop, log outcomes, export receipts JSON.</li>
          <li>PR your anonymized outcome stats to <code className="rounded bg-white/10 px-1">/docs/compliance-rows.md</code> (counts only, never identities).</li>
          <li>Or self-host Phase 2 (Postgres mode) and publish your instance&apos;s aggregate endpoint.</li>
        </ul>
      </Panel>
    </div>
  );
}
