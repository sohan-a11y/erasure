import LetterDeck from "@/components/LetterDeck";
import { Panel } from "@/components/ui";

export const metadata = { title: "Letters & receipts" };

export default function LettersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">Act — letters &amp; receipts</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Deletion letters are generated from your identity (browser-only) and personalized per broker.
        You send each one through the operator&apos;s official removal form (opened for you), then log
        the outcome. Marking <span className="text-fuchsia-400">relisted</span> when a &quot;deleted&quot; profile quietly
        reappears is exactly the evidence the public index rewards.
      </p>
      <div className="mt-8 grid gap-4">
        <Panel title="Verify-assist" sub="How to actually catch re-listing">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
            <li>Re-run the username scan on this site — hits on &quot;erased&quot; brokers are fresh evidence.</li>
            <li>Screenshot the live page with URL + date.</li>
            <li>Set the receipt status to <em>relisted</em> — in Phase 2, every relisted entry lands a public row on the Broker Compliance Index.</li>
            <li>Filing a regulator complaint (state AG / data-protection authority) with your threaded receipts is one click away from your exported JSON.</li>
          </ol>
        </Panel>
        <LetterDeck />
      </div>
    </div>
  );
}
