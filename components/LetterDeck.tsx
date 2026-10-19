"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BROKER_REGISTRY, type BrokerEntry } from "@/lib/scans/broker-registry";
import { buildLetter, nextRecheckIso } from "@/lib/letters/templates";
import { loadReceipts, loadReport, saveReceipts } from "@/lib/store";
import type { BrokerLetterStatus, BrokerReceipt } from "@/lib/types";
import { Button, Panel } from "@/components/ui";

const STATUS_ORDER: BrokerLetterStatus[] = ["pending", "sent", "acknowledged", "erased", "refused", "relisted"];

const STATUS_STYLE: Record<BrokerLetterStatus, string> = {
  pending: "text-slate-400",
  sent: "text-amber-400",
  acknowledged: "text-sky-400",
  erased: "text-emerald-400",
  refused: "text-rose-400",
  relisted: "text-fuchsia-400",
};

export default function LetterDeck() {
  const report = useMemo(() => loadReport(), []);
  const [receipts, setReceipts] = useState<BrokerReceipt[]>(() => loadReceipts());
  const [openLetter, setOpenLetter] = useState<string | null>(null);

  const identity = report?.identity;

  const rows: Array<{ broker: BrokerEntry; receipt?: BrokerReceipt; letter?: ReturnType<typeof buildLetter> }> =
    useMemo(() => {
      return BROKER_REGISTRY.filter((b) => b.id !== "veriphiq-generic-email").map((broker) => {
        const receipt = receipts.find((r) => r.brokerId === broker.id);
        const letter = identity?.fullName ? buildLetter(broker, identity) : undefined;
        return { broker, receipt, letter };
      });
    }, [identity, receipts]);

  if (!identity?.fullName || !identity.email) {
    return (
      <Panel title="Letters need your identity details" sub="They are stored only in your browser and inserted into the letter text.">
        <p className="text-sm text-slate-400">
          Run a scan with full name + email (letters module inputs), or{" "}
          <Link href="/scan" className="text-sky-400 underline">run the scan</Link> first. Nothing POSTs
          anywhere — letters are generated in your browser and you send them yourself using each
          operator&apos;s official form.
        </p>
      </Panel>
    );
  }

  function update(broker: BrokerEntry, patch: Partial<BrokerReceipt>) {
    const next = [...receipts];
    const idx = next.findIndex((r) => r.brokerId === broker.id);
    const base: BrokerReceipt = idx >= 0 ? next[idx]! : { brokerId: broker.id, brokerName: broker.name, status: "pending" };
    const merged: BrokerReceipt = { ...base, ...patch, brokerName: broker.name };
    if (idx >= 0) next[idx] = merged;
    else next.push(merged);
    setReceipts(next);
    saveReceipts(next);
  }

  function setStatus(broker: BrokerEntry, status: BrokerLetterStatus) {
    const now = new Date().toISOString();
    const patch: Partial<BrokerReceipt> = { status };
    if (status === "sent") {
      patch.letterSentAt = now;
      patch.nextRecheckAt = nextRecheckIso();
    }
    if (status === "acknowledged") patch.acknowledgedAt = now;
    if (status === "erased" || status === "refused" || status === "relisted") patch.resolvedAt = now;
    if (status === "relisted") {
      patch.nextRecheckAt = nextRecheckIso();
      patch.resolvedAt = undefined;
    }
    update(broker, patch);
  }

  function exportReceipts() {
    const blob = new Blob([JSON.stringify(receipts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erasure-receipts.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const done = receipts.filter((r) => r.status === "erased").length;
  const sent = receipts.filter((r) => ["sent", "acknowledged"].includes(r.status)).length;
  const fights = receipts.filter((r) => r.status === "refused" || r.status === "relisted").length;

  return (
    <div className="grid gap-4">
      <Panel title="Progress" sub="Yellow = work in flight · green = confirmed erased · red/purple = the ones that made it public.">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="letters sent" value={sent} />
          <Stat label="confirmed erased" value={done} />
          <Stat label="fought back (refused / re-listed)" value={fights} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={exportReceipts} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            Export receipts (JSON)
          </button>
          <span className="text-xs text-slate-500">
            Your receipt trail is the evidence that feeds the public Compliance Index (Phase 2 DB).
          </span>
        </div>
      </Panel>

      {rows.map(({ broker, receipt, letter }) => (
        <div key={broker.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{broker.name}</h3>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  {broker.category}
                </span>
                <span className={`text-xs font-medium ${STATUS_STYLE[receipt?.status ?? "pending"]}`}>
                  {receipt?.status ?? "pending"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {broker.jurisdictions.join(", ").toUpperCase()} · asks for: {broker.requires.join(", ")} · {broker.effort}
                {receipt?.nextRecheckAt ? ` · re-check scheduled ${receipt.nextRecheckAt}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={broker.optoutUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-sky-500/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-sky-400">
                open removal page ↗
              </a>
              {letter ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const payload = `Subject: ${letter.subject}\n\n${letter.body}`;
                    void navigator.clipboard.writeText(payload);
                    setOpenLetter(openLetter === broker.id ? null : broker.id);
                  }}
                  className="!px-3 !py-1.5 !text-xs"
                >
                  copy letter
                </Button>
              ) : null}
              <select
                value={receipt?.status ?? "pending"}
                onChange={(e) => setStatus(broker, e.target.value as BrokerLetterStatus)}
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none focus:border-sky-500/60"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s} className="bg-[#0b1120] capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {letter && openLetter === broker.id ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-4">
              <p className="text-xs font-medium text-sky-400">Subject: {letter.subject}</p>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{letter.body}</pre>
              <button
                onClick={() => {
                  const blob = new Blob([`Subject: ${letter.subject}\n\n${letter.body}`], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `erasure-${broker.id}-letter.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="mt-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
              >
                download .txt
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
