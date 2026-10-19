"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui";
import { APP } from "@/lib/config";

type CrowdRow = {
  brokerId: string;
  total: number;
  sent: number;
  erased: number;
  acknowledged: number;
  refused: number;
  relisted: number;
};

export default function CrowdIndex() {
  const [rows, setRows] = useState<CrowdRow[] | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/compliance/aggregate")
      .then((r) => r.json())
      .then((d: { enabled: boolean; rows?: CrowdRow[] }) => {
        setEnabled(d.enabled);
        if (d.enabled && d.rows) setRows(d.rows);
      })
      .catch(() => setEnabled(false));
  }, []);

  return (
    <Panel
      title="Crowd-verified outcomes (anonymized)"
      sub={
        enabled === null
          ? "checking the open index…"
          : enabled
            ? "live from consented receipt events"
            : "not enabled on this deployment — set POSTGRES_URL to light it up"
      }
    >
      {rows && rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-4">Operator</th>
                <th className="pb-2 pr-4">Reports</th>
                <th className="pb-2 pr-4">Erased</th>
                <th className="pb-2 pr-4">Refused</th>
                <th className="pb-2">Re-listed 🔁</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {rows.map((r) => (
                <tr key={r.brokerId} className="border-t border-white/5">
                  <td className="py-1.5 pr-4 font-medium text-white">{r.brokerId}</td>
                  <td className="py-1.5 pr-4">{r.total}</td>
                  <td className="py-1.5 pr-4 text-emerald-400">{r.erased}</td>
                  <td className="py-1.5 pr-4 text-rose-400">{r.refused}</td>
                  <td className="py-1.5 text-fuchsia-400">{r.relisted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : rows ? (
        <p className="text-sm text-slate-400">
          No rows yet. Publish outcomes from Letters → &quot;publish&quot; after you log receipts.
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Structure of this index: counts only, per operator, sourced from user-initiated exports —
        never identities, never addresses, never face or location data. Self-reporting is honest
        because every row can be re-verified: the loop is public. {APP.name} {APP.version}.
      </p>
    </Panel>
  );
}
