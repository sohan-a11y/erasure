"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadReport, maskEmail } from "@/lib/store";
import { computeScore } from "@/lib/score";
import { APP } from "@/lib/config";

/** Canvas-generated 1200x630 share card — the screenshot that travels. */
export default function ShareCardClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const report = useMemo(() => loadReport(), []);
  const score = useMemo(() => (report ? computeScore(report) : null), [report]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!report || !score) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    // background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#05070d");
    grad.addColorStop(1, "#0b1524");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // score ring
    const cx = 200, cy = H / 2, r = 96;
    ctx.lineWidth = 22;
    ctx.strokeStyle = "rgba(148,163,184,0.18)";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const frac = Math.min(100, Math.max(0, score.total)) / 100;
    const color = score.total <= 10 ? "#22c55e" : score.total <= 25 ? "#a3e635" : score.total <= 45 ? "#fbbf24" : score.total <= 70 ? "#fb923c" : "#f43f5e";
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    ctx.lineCap = "butt";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 84px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(score.total), cx, cy + 26);
    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("exposure · higher = worse", cx, cy + 66);

    // right column
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText("My digital shadow,", 380, 150);
    ctx.fillStyle = color;
    ctx.fillText(`grade ${score.grade}.`, 380, 226);

    ctx.fillStyle = "rgba(231,234,242,0.85)";
    ctx.font = "30px system-ui, sans-serif";
    const id = report.identity;
    const who = id.email ? maskEmail(id.email) : id.username ? `@${id.username}` : "anonymous scan";
    ctx.fillText(`${who}`, 380, 292);

    ctx.font = "28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(231,234,242,0.75)";
    const breachCount = Array.isArray(report.breaches) ? report.breaches.length : null;
    const lines = [
      `${report.usernameHits.length} live profiles under my handle`,
      breachCount !== null ? `${breachCount} breach${breachCount === 1 ? "" : "es"} indexed` : "breach module skipped",
      report.passwords.checked ? (report.passwords.exposed ? "test password was pwned" : "test password clean") : "password module skipped",
      report.exifFindings.length > 0 ? "photos leaked GPS coordinates" : "no GPS leaks found",
    ];
    lines.forEach((t, i) => ctx.fillText(`· ${t}`, 380, 360 + i * 46));

    // footer
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = "bold 26px system-ui, sans-serif";
    ctx.fillText("ERASURE  ·  find it. erase it. prove it stayed gone.", 48, H - 56);
    ctx.font = "22px system-ui, sans-serif";
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.fillText("open-source self-defense OSINT", 48, H - 20);

    setReady(true);
  }, [report, score]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `erasure-exposure-card.png`;
    a.click();
  }

  return (
    <div>
      <canvas ref={canvasRef} width={1200} height={630} className="w-full rounded-xl border border-white/10" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={download}
          disabled={!ready}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-black hover:bg-sky-400 disabled:opacity-50"
        >
          ⬇ Download share card
        </button>
        <span className="text-xs text-slate-500">
          {APP.name} renders everything client-side — the card contains your masked email, never the
          raw one.
        </span>
      </div>
    </div>
  );
}
