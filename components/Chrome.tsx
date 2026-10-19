import Link from "next/link";
import { APP } from "@/lib/config";

const links = [
  { href: "/scan", label: "Scan" },
  { href: "/letters", label: "Letters" },
  { href: "/compliance", label: "Compliance" },
  { href: "/about", label: "Ethics" },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-500/10 bg-[#05070d]/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4">
        <Link href="/" className="mr-3 flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-400">⌫</span>
          <span>Erasure</span>
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
        <div className="flex-1" />
        <a
          href="https://github.com/your-handle/erasure"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
        >
          ★ GitHub
        </a>
        <Link
          href="/scan"
          className="ml-2 rounded-lg bg-sky-500 px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-sky-400"
        >
          Run scan →
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-500/10 px-4 py-10">
      <div className="mx-auto max-w-5xl text-sm text-slate-400">
        <p className="font-medium text-slate-300">Erasure {APP.version}</p>
        <p className="mt-2 max-w-2xl leading-6">
          {APP.description}
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Self-defense OSINT only. No person-location mode. No face search against strangers. Public
          data in, receipts out. MIT licensed.
        </p>
      </div>
    </footer>
  );
}
