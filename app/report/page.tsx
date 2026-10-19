import ScoreRing from "@/components/ScoreRing";
import ShareCardClient from "@/components/ShareCardClient";
import ReportView from "@/components/ReportView";

export const metadata = { title: "Your exposure report" };

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-white">Your exposure report</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <ScoreRing />
        <div>
          <ShareCardClient />
        </div>
      </div>
      <div className="mt-10">
        <ReportView />
      </div>
    </div>
  );
}
