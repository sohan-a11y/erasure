"use client";

import { useMemo } from "react";
import Link from "next/link";
import { loadReport, maskEmail } from "@/lib/store";
import { computeScore, gradeLabel } from "@/lib/score";
import { Panel } from "@/components/ui";

export default function ReportView() {
  const report = useMemo(() => loadReport(), []);
  if (!report) {
    return (
      <Panel title="No report on this device">
        <p className="text-sm text-slate-400">
          Reports live only in your browser. Run a scan to generate one.
        </p>
        <Link href="/scan" className="mt-3 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-black hover:bg-sky-400">
          Run scan →
        </Link>
      </Panel>
    );
  }

  const score = computeScore(report);
  return (
    <div className="grid gap-4">
      <Panel title="Report summary" sub={`Generated ${new Date(report.createdAt).toLocaleString()} · consent logged`}>
        <dl className="grid gap-2 text-sm text-slate-300">
          <div className="flex justify-between gap-6 border-b border-white/5 pb-2">
            <dt className="text-slate-500">Identity</dt>
            <dd>{maskEmail(report.identity.email)} · @...{report.identity.username?.slice(-4)} · {report.identity.jurisdiction.toUpperCase()}</dd>
          </div>
          <div className="flex justify-between gap-6 border-b border-white/5 pb-2">
            <dt className="text-slate-500">Score</dt>
            <dd>
              {score.total}/100 · grade {score.grade} ({gradeLabel(score.grade)}) · modules: {score.weightsUsed.join(", ")}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title={`Username footprint — ${report.usernameHits.length} live profiles`} sub="Leads found via headline lookups on the open WhatsMyName ruleset. Manually verify each before treating it as fact.">
        <div className="flex flex-wrap gap-2">
          {report.usernameHits.map((h) => (
            <a
              key={h.url}
              href={h.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-500/20"
            >
              {h.site}
            </a>
          ))}
        </div>
      </Panel>

      {Array.isArray(report.breaches) ? (
        <Panel title={`Email breaches — ${report.breaches.length}`} sub="From the Have I Been Pwned corpus. Rotate any reused password immediately.">
          <ul className="space-y-1.5 text-sm text-slate-300">
            {report.breaches.map((b) => (
              <li key={b.name} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-1.5">
                <span className="font-medium text-rose-300">{b.title || b.name}</span>
                <span className="text-xs text-slate-500">{b.breachDate} · {b.dataClasses.slice(0, 4).join(", ")}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel title="Email breaches — module skipped" sub="No HIBP key at deploy time; run again from a deployment with HIBP_KEY set to include it.">
          <a href="https://haveibeenpwned.com/" target="_blank" rel="noreferrer" className="text-sm text-sky-400 underline">Manual check →</a>
        </Panel>
      )}

      {report.passwords.checked ? (
        <Panel title="Password check">
          <p className={`text-sm ${report.passwords.exposed ? "text-rose-400" : "text-emerald-400"}`}>
            {report.passwords.exposed
              ? `⚠ Your test password appeared in ${report.passwords.seenCount?.toLocaleString()} dumps. Rotate it.`
              : "✓ Your test password is not in the public pwned corpus."}
          </p>
        </Panel>
      ) : null}

      {report.exifFindings.length > 0 ? (
        <Panel title="Photo GPS leaks" sub="Tested files exposed coordinates — disable location tagging for shared photos.">
          <ul className="text-sm text-slate-300">
            {report.exifFindings.map((f) => (
              <li key={f.fileName + (f.lat ?? "")}>
                📍 {f.fileName} → {f.lat?.toFixed(4)}, {f.lon?.toFixed(4)}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/letters" className="rounded-xl bg-sky-500 px-6 py-3 font-medium text-black hover:bg-sky-400">
          Next: Act — generate removal letters →
        </Link>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "erasure-report.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="rounded-xl border border-white/10 px-6 py-3 text-slate-200 hover:bg-white/5"
        >
          Export report (JSON)
        </button>
      </div>
    </div>
  );
}
