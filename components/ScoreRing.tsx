"use client";

import { useMemo } from "react";
import Link from "next/link";
import { loadReport } from "@/lib/store";
import { computeScore, gradeLabel } from "@/lib/score";

const GRADE_COLOR: Record<string, string> = {
  A: "#22c55e",
  B: "#a3e635",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#f43f5e",
};

export default function ScoreRing() {
  const report = useMemo(() => loadReport(), []);
  if (!report) {
    return (
      <div className="card p-6">
        <p className="text-sm text-slate-400">No report yet. Run a scan first.</p>
        <Link href="/scan" className="mt-3 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-black hover:bg-sky-400">
          Run scan →
        </Link>
      </div>
    );
  }

  const score = computeScore(report);
  const color = GRADE_COLOR[score.grade];
  const R = 70;
  const C = 2 * Math.PI * R;
  const dash = (Math.min(100, Math.max(3, score.total)) / 100) * C;

  return (
    <div className="card flex flex-col items-center p-6">
      <div className="relative h-[180px] w-[180px]">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="14" />
          <circle
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-white">{score.total}</div>
          <div className="text-xs text-slate-500">exposure · higher = worse</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-lg font-bold" style={{ color }}>
          {score.grade} — {gradeLabel(score.grade)}
        </div>
      </div>
    </div>
  );
}
