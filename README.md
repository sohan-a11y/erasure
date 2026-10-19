<div align="center">

# ⌫ Erasure

**Find it. Erase it. Prove it stayed gone.**

The free, open-source OSINT loop that every other tool refuses to close.
Shodan finds exposed *devices*. Sherlock finds your *handles*. HIBP *reports* your breaches.
**Erasure is the tool that helps you finish the job** — and publicly receipts the data brokers who block it.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![PRs: charter-checked](https://img.shields.io/badge/PRs-charter%E2%80%91checked-brightgreen)](./app/about/page.tsx)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-handle%2Ferasure&env=HIBP_KEY)

</div>

---

## Why this exists

- Every OSINT tool in the ecosystem is **detect-only**. It stops at the screenshot moment.
- Big Tech walked away from consumer protection: Google killed its dark-web report (Jan 2026), HIBP gates breach alerts behind a $379/mo API, and paid removal services charge $100+/yr to fight a fight you must re-fight every 60–90 days (because brokers **re-list** deleted people).
- An academic audit of all 543 California-registered data brokers found **>40% simply ignore deletion requests**; only 9% of registered brokers are fully compliant with transparency duties.

Erasure runs the full loop, free and in public:

```
01 DETECT  scan your verified identity (breaches · handle footprint · EXIF GPS · pwned passwords)
02 ACT     generate jurisdiction-aware deletion letters (CCPA / GDPR / US-state / generic)
03 VERIFY  track each letter as a receipt: sent → acknowledged → erased → re-listed?
04 EXPOSE  aggregate outcomes into the public Broker Compliance Index
```

## The moral core (read before forking)

**This tool is aimed at the person operating it — only.**

- No face search against strangers. No "find anyone" mode. No address aggregation.
- Every scan sits behind an identity-ownership consent gate.
- Scanning is respectful: low rate, honest UA, immediate back-off.
- Suggestions that map onto locating other people will be declined, loudly, in public.

Aimed at yourself, OSINT is self-defense. That's the whole ballgame. See the in-app [ethics charter](#) page (`/about`).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4, zero component deps |
| Scan engine | Open [WhatsMyName](https://github.com/WebBreacher/whatsmyname) ruleset (300+ platforms) + built-in fallback list |
| Breach data | [HIBP](https://haveibeenpwned.com) — free pwned-password range API (k-anonymity) + optional `HIBP_KEY` for account breaches |
| Storage | **Zero-config**: reports, letters, receipts in `localStorage` + JSON export. Optional Postgres mode ships in Phase 2. |
| Deploy | Vercel one-click (free tier) |

## Quick start

```bash
git clone https://github.com/your-handle/erasure
cd erasure
npm install
cp .env.example .env.local   # HIBP_KEY= is optional
npm run dev
```

Open http://localhost:3000 → **Run your exposure scan**.

## Deploy (60 seconds)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-handle%2Ferasure&env=HIBP_KEY)

Set `HIBP_KEY` (free-style key from [haveibeenpwned.com/API/Key](https://haveibeenpwned.com/API/Key)) to light up the breach module — everything else works keyless.

## Environment

| Var | Required | Purpose |
|---|---|---|
| `HIBP_KEY` | no | enables email-breach lookups (server-side only) |
| `WHATSMYNAME_LIST_URL` | no | override dataset source |
| `SCANNER_USER_AGENT` | no | override scanner UA |

## Architecture notes

- **Chunked serverless scanning** — the 300+ platform probe runs in ≤40-site chunks via `POST /api/scan/username`, so it fits in free-tier function limits; the client keeps progress on rate-limit and can resume.
- **Client-side EXIF** — photos are parsed in the browser and never uploaded.
- **k-anonymity password check** — only the first 5 hex chars of a SHA-1 leave the browser.
- **Letters engine** — `lib/letters/templates.ts` renders CCPA/GDPR/state-aware letters with reference IDs + 60-day recheck scheduling.

## Roadmap

- [x] Phase 1 — the loop, zero-config deploy, share-card generator
- [ ] Phase 2 — optional Postgres mode → public compliance rows from consented receipts (+ GitHub Actions cron template for verification jobs)
- [ ] Jurisdiction templates: UK DMA, Canada PIPEDA, India DPDP
- [ ] Domain watch tab: new subdomains/cert changes for domains you own
- [ ] org-SaaS exposure audit (public Trello/Slack artifacts under *your own* domain)

## License

MIT — see [LICENSE](./LICENSE). The data broker registry is hand-curated with `lastChecked` dates; PRs to fix/remove stale URLs are gold.
