"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Panel, Stat } from "@/components/ui";
import { readExifGps } from "@/lib/scans/exif";
import type { BreachFinding, ExifFinding, UsernameHit } from "@/lib/types";
import { saveReport, loadReport } from "@/lib/store";

const JURISDICTIONS = [
  { value: "ccpa", label: "California (CCPA/CPRA)" },
  { value: "gdpr", label: "EU / EEA (GDPR)" },
  { value: "us-state", label: "Other US state privacy law" },
  { value: "generic", label: "Generic / other country" },
] as const;

type ScanChunk = {
  results: Array<{ site: string; category: string; url: string; status: number; found: boolean; note?: string }>;
  from: number;
  total: number;
  done: boolean;
};

export default function ScanWizard() {
  const router = useRouter();
  const existing = useMemo(() => loadReport(), []);

  // consent
  const [own, setOwn] = useState(false);
  const [adult, setAdult] = useState(false);

  // identity
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [jurisdiction, setJurisdiction] = useState<(typeof JURISDICTIONS)[number]["value"]>("generic");
  const [quickMode, setQuickMode] = useState(true);

  // scanning state
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [hits, setHits] = useState<UsernameHit[]>([]);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("");

  // password module
  const [testPassword, setTestPassword] = useState("");
  const [pwState, setPwState] = useState<
    { state: "idle" } | { state: "checking" } | { state: "result"; exposed: boolean; seenCount: number } | { state: "error" }
  >({ state: "idle" });

  // exif module
  const fileRef = useRef<HTMLInputElement>(null);
  const [exif, setExif] = useState<ExifFinding | null>(null);

  // breach module
  const [breachState, setBreachState] = useState<
    { state: "idle" } | { state: "running" } | { state: "needsKey" } | { state: "done"; breaches: BreachFinding[] } | { state: "error" }
  >({ state: "idle" });

  const canStart = own && adult && username.trim().length >= 3 && username.length <= 80;
  const body = {
    username,
    email,
    fullName,
    city,
    state: stateName,
    country,
    jurisdiction,
  };

  async function runUsernameScan() {
    setScanning(true);
    setScanErr(null);
    setHits([]);
    setProgress({ done: 0, total: 0 });
    const collected: UsernameHit[] = [];
    const CHUNK = 40;
    let from = 0;
    const maxChunks = quickMode ? 2 : 999;
    try {
      let res: ScanChunk | null = null;
      for (let i = 0; i < maxChunks; i++) {
        const resp = await fetch("/api/scan/username", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ account: username.trim(), from, size: CHUNK }),
        });
        if (!resp.ok) {
          const data = (await resp.json().catch(() => ({}))) as { error?: string; retryAfterSec?: number };
          if (data.error === "rate_limited") {
            setScanErr(`Rate limit reached — wait ${data.retryAfterSec ?? 60}s and continue (your progress is kept).`);
          } else {
            setScanErr(`Scan failed (${resp.status}). Try again in a moment.`);
          }
          break;
        }
        res = (await resp.json()) as ScanChunk;
        setDataSource(sourceLabel(res.total));
        setProgress({ done: res.from, total: res.total });
        for (const r of res.results) {
          if (r.found) {
            collected.push({ site: r.site, category: r.category, url: r.url, status: r.status });
            setHits([...collected]);
          }
        }
        from = res.from;
        if (res.done) break;
      }
    } catch {
      setScanErr("Network hiccup — progress kept, you can re-run to continue.");
    } finally {
      setScanning(false);
    }
  }

  function sourceLabel(total: number): string {
    return total > 50 ? `open WhatsMyName dataset (${total} platforms)` : `built-in list (${total} platforms)`;
  }

  async function checkPassword() {
    if (!testPassword) return;
    setPwState({ state: "checking" });
    try {
      const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(testPassword));
      const hex = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      const prefix = hex.slice(0, 5);
      const suffix = hex.slice(5);
      // The un-hashed password never leaves this browser — only 5 hex chars.
      const resp = await fetch("/api/scan/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefix }),
      });
      if (!resp.ok) {
        setPwState({ state: "error" });
        return;
      }
      const data = (await resp.json()) as { counts: Record<string, number> };
      const count = data.counts[suffix] ?? 0;
      setPwState({ state: "result", exposed: count > 0, seenCount: count });
      setTestPassword("");
    } catch {
      setPwState({ state: "error" });
    }
  }

  async function handleFile(file: File) {
    try {
      const meta = await readExifGps(file);
      setExif(meta);
    } catch {
      setExif({ fileName: file.name, hasGps: false });
    }
  }

  async function checkBreaches() {
    if (!email) return;
    setBreachState({ state: "running" });
    try {
      const resp = await fetch(`/api/scan/email-breaches?email=${encodeURIComponent(email)}`);
      const data = (await resp.json()) as { needsKey?: boolean; breaches?: BreachFinding[] };
      if (data.needsKey) setBreachState({ state: "needsKey" });
      else setBreachState({ state: "done", breaches: data.breaches ?? [] });
    } catch {
      setBreachState({ state: "error" });
    }
  }

  function generateReport() {
    const report = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      consent: { ownIdentity: own, adult, grantedAt: new Date().toISOString() },
      identity: body,
      breaches:
        breachState.state === "done"
          ? breachState.breaches
          : { skipped: true as const, reason: "no-hibp-key" as const, howTo: "", manualCheckUrl: "https://haveibeenpwned.com/" },
      breachesIncludedInScore: breachState.state === "done",
      passwords:
        pwState.state === "result"
          ? { checked: true, exposed: pwState.exposed, seenCount: pwState.seenCount }
          : { checked: false, exposed: false },
      usernameHits: hits,
      usernameScanned: progress.done || (quickMode ? 80 : 0),
      exifFindings: exif && exif.hasGps ? [exif] : [],
    };
    saveReport(report);
    router.push("/report");
  }

  return (
    <div className="grid gap-4">
      <Panel title="Consent gate" sub="This tool only exists to protect the person operating it.">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-sky-500" />
          <span>
            I confirm the username/identity I am about to scan is <strong>my own</strong> (or I am the
            account owner&apos;s authorized representative). I will not use Erasure against other
            people.
          </span>
        </label>
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-4 w-4 accent-sky-500" />
          <span>I am 18 or older (deletion letters contain legal statements).</span>
        </label>
      </Panel>

      <Panel title="Your identity inputs" sub="Email/name/city are optional — they power the letters module. Nothing is uploaded; identity data lives only in your browser's localStorage.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Username or handle *" value={username} onChange={setUsername} placeholder="your-username" />
          <Field label="Email (breach scan + letters)" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          <Field label="Full name (for letters)" value={fullName} onChange={setFullName} placeholder="Optional — used in deletion letters" />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="State / region" value={stateName} onChange={setStateName} />
          <Field label="Country" value={country} onChange={setCountry} placeholder="US / DE / IN ..." />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Legal framework for letters</label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value as (typeof JURISDICTIONS)[number]["value"])}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
            >
              {JURISDICTIONS.map((j) => (
                <option key={j.value} value={j.value} className="bg-[#0b1120]">
                  {j.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={quickMode} onChange={(e) => setQuickMode(e.target.checked)} className="h-4 w-4 accent-sky-500" />
          Quick scan (first ~80 platforms — full run checks every platform in the dataset)
        </label>
      </Panel>

      <Button onClick={runUsernameScan} disabled={!canStart || scanning} className="w-full py-3 text-base">
        {scanning ? `Scanning… ${progress.done}/${progress.total || "…"}` : canStart ? "Start exposure scan" : "Consent + username required"}
      </Button>
      {scanErr ? <p className="text-sm text-amber-400">{scanErr}</p> : null}
      {progress.total > 0 && !scanning ? (
        <p className="text-xs text-slate-500">Ran against the {dataSource}.</p>
      ) : null}

      {hits.length > 0 || scanning ? (
        <Panel title={`Found ${hits.length} profiles`} sub="These are places where your handle currently resolves to a live page. Verify each — they are leads, not verdicts.">
          <div className="flex flex-wrap gap-2">
            {hits.map((h) => (
              <a
                key={h.site + h.url}
                href={h.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-200 hover:bg-sky-500/20"
              >
                {h.site} <span className="text-sky-500/60">· {h.category}</span>
              </a>
            ))}
            {scanning && <span className="animate-pulse text-xs text-slate-400">scanning…</span>}
          </div>
        </Panel>
      ) : null}

      <Panel title="Password exposure (optional)" sub="Type-test a password against the pwned-passwords corpus. Only the first 5 hex chars of the SHA-1 leave your browser (k-anonymity).">
        <div className="flex flex-wrap gap-2">
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            placeholder="never actually used in the clear"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
          />
          <Button variant="ghost" onClick={checkPassword} disabled={!testPassword || pwState.state === "checking"}>
            Check
          </Button>
        </div>
        {pwState.state === "result" ? (
          pwState.exposed ? (
            <p className="mt-3 text-sm text-rose-400">
              ⚠ Exposed in {pwState.seenCount.toLocaleString()} known credential dumps — if you still
              use it anywhere, rotate it everywhere.
            </p>
          ) : (
            <p className="mt-3 text-sm text-emerald-400">✓ Not present in public breach corpora.</p>
          )
        ) : pwState.state === "error" ? (
          <p className="mt-3 text-sm text-amber-400">Check failed — try again.</p>
        ) : null}
      </Panel>

      <Panel title="Email breaches (optional)" sub={email ? `Runs against your email: ${email}` : "Add an email above first."}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={checkBreaches} disabled={!email || breachState.state === "running"}>
            Check my email
          </Button>
          {breachState.state === "running" ? <span className="text-xs text-slate-400">contacting breach corpus…</span> : null}
        </div>
        {breachState.state === "done" ? (
          breachState.breaches.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-400">✓ No breaches indexed for this email.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {breachState.breaches.map((b) => (
                <div key={b.name} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                  <div className="text-sm font-semibold text-rose-300">{b.title || b.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {b.breachDate} · {b.domain || "—"}
                  </div>
                  {b.dataClasses.length ? (
                    <div className="mt-1 text-xs text-slate-300">Exposed: {b.dataClasses.join(", ")}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )
        ) : breachState.state === "needsKey" ? (
          <p className="mt-3 text-xs leading-6 text-slate-400">
            Breach-email lookups are key-gated by Have I Been Pwned (their free tier is the website
            only). Two options: add a <code className="rounded bg-white/10 px-1">HIBP_KEY</code> env
            var on your deployment to enable it for everyone, or{" "}
            <a className="text-sky-400 underline" href="https://haveibeenpwned.com/" target="_blank" rel="noreferrer">
              check yourself on their site
            </a>{" "}
            and continue — your report still scores the scan minus this module.
          </p>
        ) : breachState.state === "error" ? (
          <p className="mt-3 text-sm text-amber-400">Lookup failed — try again later.</p>
        ) : null}
      </Panel>

      <Panel title="Photo EXIF / GPS leak (optional)" sub="100% on-device: the photo is parsed in your browser and never uploaded.">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          Choose a JPEG
        </Button>
        {exif ? (
          <div className="mt-3 text-sm">
            {exif.hasGps ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-amber-300">
                  ⚠ {exif.fileName} contains GPS coordinates!
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {exif.lat?.toFixed(5)}, {exif.lon?.toFixed(5)}
                  {exif.takenAt ? ` · taken ${exif.takenAt}` : ""}
                  {exif.camera ? ` · ${exif.camera}` : ""} —{" "}
                  <a
                    className="text-sky-400 underline"
                    href={`https://www.openstreetmap.org/?mlat=${exif.lat}&mlon=${exif.lon}#map=15/${exif.lat}/${exif.lon}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    open map
                  </a>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  share photos like this and anyone with the file can map your life. Strip GPS before
                  posting.
                </p>
              </div>
            ) : (
              <p className="text-emerald-400">✓ No GPS coordinates in {exif.fileName}.</p>
            )}
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value={hits.length} label="Live profiles found" />
        <Stat value={progress.done} label="Platforms checked" />
        <Stat value={breachState.state === "done" ? breachState.breaches.length : "—"} label="Breaches indexed" />
      </div>

      <Button onClick={generateReport} disabled={progress.done === 0 && !existing} className="w-full py-3 text-base">
        → Generate exposure report
      </Button>
      {progress.done === 0 && !existing ? (
        <p className="text-center text-xs text-slate-500">Run at least the quick scan to generate a report.</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-sky-500/60"
      />
    </div>
  );
}
