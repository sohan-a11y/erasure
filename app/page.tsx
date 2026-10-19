import Link from "next/link";
import { APP } from "@/lib/config";
import { Stat } from "@/components/ui";

const loop = [
  {
    step: "01",
    name: "Detect",
    copy: "Scan your verified identity: breach databases, username reuse across hundreds of platforms, EXIF leaks, data-broker listings.",
  },
  {
    step: "02",
    name: "Act",
    copy: "Generate jurisdiction-aware deletion letters (CCPA / GDPR / state laws) with tracked references, and the exact removal URL for each broker.",
  },
  {
    step: "03",
    name: "Verify",
    copy: "Track every letter as a receipt: sent → acknowledged → erased — with a scheduled re-check to catch brokers that quietly re-list you.",
  },
  {
    step: "04",
    name: "Expose",
    copy: "Your outcomes (opt-in, anonymized) feed the public Broker Compliance Index: which operators honor deletions, which ghost you, which re-list.",
  },
];

export default function Home() {
  return (
    <div className="bg-grid">
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          Free &amp; open source · MIT · self-defense OSINT only
        </div>

        <h1 className="glow-text mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
          {APP.tagline.split(".")[0]}.<br />
          {(APP.tagline.split(".")[1] ?? "").trim()}.<br />
          <span className="text-sky-400">{(APP.tagline.split(".")[2] ?? "").trim()}.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Every OSINT tool — Shodan included — stops at <em>finding</em>. Databases pay wall the fix.
          Big Tech walked away: Google shut its Dark Web report in early 2026; Have I Been Pwned
          charges $379/mo for its full alert API; data brokers ignore &gt;40% of deletion requests
          and only 9% of registered brokers are fully compliant with transparency rules.
          <br />
          <span className="text-white">
            Erasure closes the loop — for free, in public, with receipts.
          </span>
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/scan"
            className="rounded-xl bg-sky-500 px-6 py-3 font-medium text-black transition-colors hover:bg-sky-400"
          >
            Run your exposure scan →
          </Link>
          <Link
            href="/compliance"
            className="rounded-xl border border-white/10 px-6 py-3 text-slate-200 transition-colors hover:bg-white/5"
          >
            See the Broker Compliance Index
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            value="$0"
            label="What the food-chain charges for: Incogni $100+/yr, HIBP Pro $379/mo"
            hint="Erasure is free, forever — the goal is the Compliance Index, not your wallet."
          />
          <Stat
            value=">40%"
            label="Deletion requests data brokers simply ignore (audited, 543 brokers)"
            hint="CCPA compliance audit, 2025 — arXiv:2506.21914"
          />
          <Stat
            value="60 days"
            label="How often Erasure schedules re-checks to catch secret re-listing"
            hint="Brokers re-adding deleted people is a documented pattern — we turn it into evidence."
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-4 pt-16">
        <h2 className="text-2xl font-bold tracking-tight text-white">The loop no one else runs</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {loop.map((s) => (
            <div key={s.step} className="card p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-sky-400">{s.step}</span>
                <h3 className="text-lg font-semibold text-white">{s.name}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{s.copy}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Scope: everything you scan or send through Erasure is about <strong>you</strong>. It does
          not locate strangers, score other people, or aggregate identities. Keep it that way — read
          the <Link href="/about" className="text-sky-400 underline decoration-sky-900">ethics charter</Link>.
        </p>
      </section>
    </div>
  );
}
