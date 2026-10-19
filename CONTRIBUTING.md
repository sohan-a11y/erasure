# Contributing

PRs welcome — after the charter check (see `/about` in the running app, `app/about/page.tsx` in code):

1. Will this feature still only act on the operator's *own* identity? If it helps "find others", it will be declined.
2. Highest-value contributions:
   - New data-broker removal URLs (update `lib/scans/broker-registry.ts` + bump `lastChecked`)
   - New jurisdiction letter templates (`lib/letters/templates.ts`)
   - Phase 2: optional Postgres mode for aggregated compliance rows + GitHub Actions cron template
3. Keep the rate limits conservative. Scanning aggressively breaks it for everyone.
4. `npm run build` must pass.
