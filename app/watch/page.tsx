import WatchClient from "@/components/WatchClient";

export const metadata = { title: "Domain watch" };

export default function WatchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">Watch — your own domains</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        Certificate Transparency is a free, public firehose of every HTTPS certificate issued for
        every domain. For domains you own it is a change-detection feed: new hostnames, unusual
        issuers, certs you didn&apos;t order. The same data paid &quot;attack-surface monitoring&quot; vendors
        resell — here it is free.
      </p>
      <div className="mt-8">
        <WatchClient />
      </div>
    </div>
  );
}
