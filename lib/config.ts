export const APP = {
  name: "Erasure",
  tagline: "Find it. Erase it. Prove it stayed gone.",
  description:
    "The free, open-source OSINT loop for your own identity: detect your exposure, generate removal requests, verify the brokers actually deleted you, and expose the ones who refuse. Every step is consent-scoped to your own data.",
  repo: "https://github.com/your-handle/erasure",
  version: "0.9.0",
  license: "MIT",
} as const;

/** Scoring weights (before renormalization when a module is skipped). */
export const SCORE_WEIGHTS = {
  breaches: 41,
  usernames: 27,
  passwords: 9,
  brokers: 23,
} as const;

export const RECHECK_INTERVAL_DAYS = 60;
