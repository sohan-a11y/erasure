import { SCORE_WEIGHTS } from "./config";
import type { Report, Score } from "./types";

/**
 * Exposure score 0-100 (higher = more exposed for YOU).
 * Skipped modules drop their weight (renormalized), so an anonymous
 * username-only scan still produces a meaningful number.
 */
export function computeScore(report: Report): Score {
  const parts: Score["parts"] = {};
  const weights: Record<string, number> = {};

  // --- Breaches ---
  if (Array.isArray(report.breaches)) {
    const count = report.breaches.length;
    // 1 breach ~ mild, 4+ ~ severe (diminishing curve)
    parts.breaches = Math.round(100 * (1 - Math.exp(-count / 1.6)));
    weights.breaches = SCORE_WEIGHTS.breaches;
  }

  // --- Username reuse ---
  if (report.usernameScanned > 0) {
    const ratio = report.usernameHits.length / Math.max(1, report.usernameScanned);
    // 0 hits = 0; 5% of platforms hit is already a bulky digital shadow
    parts.usernames = Math.round(100 * (1 - Math.exp(-ratio * 60)));
    weights.usernames = SCORE_WEIGHTS.usernames;
  }

  // --- Password exposure ---
  if (report.passwords.checked) {
    parts.passwords = report.passwords.exposed ? 100 : 0;
    weights.passwords = SCORE_WEIGHTS.passwords;
  }

  // --- Broker letters coverage (did you ask everyone to delete you?) ---
  if (report.identity.email && report.identity.fullName) {
    // Full identity enables the Act loop; grading assumes letters to be sent.
    parts.brokers = 30; // starting state: letters pending => some exposure remains
    weights.brokers = SCORE_WEIGHTS.brokers;
  }

  const entries = Object.entries(weights);
  const wSum = entries.reduce((a, [, w]) => a + w, 0);
  const total = entries.reduce(
    (a, [k]) => a + (parts[k as keyof Score["parts"]] ?? 0) * weights[k],
    0,
  ) / Math.max(1, wSum);

  const rounded = Math.max(0, Math.min(100, Math.round(total)));
  const grade: Score["grade"] =
    rounded <= 10 ? "A" : rounded <= 25 ? "B" : rounded <= 45 ? "C" : rounded <= 70 ? "D" : "F";

  return {
    total: rounded,
    grade,
    parts,
    weightsUsed: entries.map(([k]) => k),
  };
}

export function gradeLabel(grade: Score["grade"]): string {
  switch (grade) {
    case "A": return "Locked down";
    case "B": return "Mostly clean";
    case "C": return "Noticeable exposure";
    case "D": return "Heavy exposure";
    case "F": return "Fully pwned";
  }
}
