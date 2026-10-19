import ScanWizard from "@/components/ScanWizard";

export const metadata = { title: "Run your exposure scan" };

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">Exposure scan</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Detect (what&apos;s out there about you) → Act (letters) → Verify (receipts) → Expose
        (compliance index). Everything runs consent-gated; identity data stays in your browser.
      </p>
      <div className="mt-8">
        <ScanWizard />
      </div>
    </div>
  );
}
