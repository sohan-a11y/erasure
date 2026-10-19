import { Panel } from "@/components/ui";
import { APP } from "@/lib/config";

export const metadata = { title: "Ethics & scope" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">Ethics &amp; scope</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        OSINT has two directions: aimed at others it becomes surveillance; aimed at yourself it
        becomes defense. {APP.name} is deliberately, structurally the second kind — and that
        constraint is a feature, not a limitation to be patched around.
      </p>

      <div className="mt-8 grid gap-4">
        <Panel title="The charter" sub="What this project will always be">
          <ul className="list-disc space-y-2 text-sm leading-6 text-slate-300">
            <li><strong>Self-identity only.</strong> Every scan starts at a consent gate. We implement no capability for &quot;find me that stranger&quot;: no face search, no address aggregation, no identity de-anonymization.</li>
            <li><strong>Public data, protective action.</strong> We consume open datasets (WhatsMyName rules, breach corpora the user opts into, public removal forms) and produce private actions for the user: reports, letters, receipts.</li>
            <li><strong>Server keeps nothing.</strong> v1 stores reports/letters in your browser. Phase 2&apos;s optional database stores only receipts you explicitly export, keyed by anonymized broker outcomes.</li>
            <li><strong>Evidence, not vigilantism.</strong> The Compliance Index documents operator behavior for regulators, journalists, and consumers — it never doxxes individuals.</li>
            <li><strong>Respectful scanning.</strong> Low request rates, short timeouts, an honest User-Agent string, and immediate back-off when sites signal `429`.</li>
          </ul>
        </Panel>

        <Panel title="What we will never build" sub="The line in the sand">
          <ul className="grid list-disc gap-1 pl-5 text-sm leading-6 text-slate-300 sm:grid-cols-2">
            <li>Face-recognition against strangers (Clearview-style)</li>
            <li>People-search / address-lookup mode for others</li>
            <li>Stolen-database mirrors or &quot;leak search&quot;</li>
            <li>Identity graphs merging brokerlettes</li>
            <li>Export designed for scraping users</li>
            <li>Anything named &quot;find anyone&quot;</li>
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            These ideas are popular — and the reason tools die: criminal complaints, GDPR motion
            kills, hosting bans. The protective lane is where open-source survives.
          </p>
        </Panel>

        <Panel title="The evidence base" sub="Why we built this loop">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-300">
            <li>
              Pew Research: 57% of internet users have searched their own name; 81% feel they have no
              control over company-collected data —{" "}
              <a className="text-sky-400 underline" href="https://www.pewresearch.org/internet/2019/11/15/americans-and-privacy-confused-bored-and-overwhelmed-by-privacy-policies/" target="_blank" rel="noreferrer">pewresearch.org</a>
            </li>
            <li>
              CCPA audit of all registered data brokers — only 9% fully compliant; &gt;40% ignore
              deletion requests (arXiv 2506.21914, 2605.21376 — verify on{" "}
              <a className="text-sky-400 underline" href="https://arxiv.org" target="_blank" rel="noreferrer">arxiv.org</a>)
            </li>
            <li>
              Google discontinued its consumer dark-web report in early 2026; no free successor with
              an ongoing action loop exists —{" "}
              <a className="text-sky-400 underline" href="https://www.yorba.co/yorblog/have-i-been-pwned-alternatives-the-best-breach-checkers-in-2026" target="_blank" rel="noreferrer">Yorba roundup</a>
            </li>
            <li>
              HIBP account-breach API is key-gated/paid; password-range API remains free (this
              project uses the free endpoint with k-anonymity) —{" "}
              <a className="text-sky-400 underline" href="https://haveibeenpwned.com/Pricing" target="_blank" rel="noreferrer">pricing</a>
            </li>
            <li>
              Paid removal services re-file requests every 60–90 days — proof that re-listing is a
              standing pattern, not an edge case
            </li>
          </ul>
        </Panel>

        <Panel title="License & contribution" sub="MIT — fork it, host your own, break it open">
          <p className="text-sm leading-6 text-slate-300">
            Contributions must pass the charter check above. Ideas that map onto &quot;find others&quot;
            will be declined, loudly, in public. Increasing the platform list, refining the letters
            (new jurisdictions), and Phase 2 (Postgres compliance aggregator + GitHub Actions cron
            template) are the highest-value PRs.
          </p>
        </Panel>
      </div>
    </div>
  );
}
