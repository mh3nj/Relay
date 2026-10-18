import { KOCH_ORDER } from "@/lib/morse";
import type { SymbolStat } from "@/types/learn";

export type MasteryTier = "notStarted" | "learning" | "confident" | "mastered";

export function accuracyFor(stat: SymbolStat | undefined): number {
  if (!stat || stat.attempts === 0) return 0;
  return stat.correct / stat.attempts;
}

export function tierFor(stat: SymbolStat | undefined): MasteryTier {
  if (!stat || stat.attempts === 0) return "notStarted";
  const acc = accuracyFor(stat);
  if (stat.attempts < 5) return "learning";
  if (acc >= 0.9) return "mastered";
  if (acc >= 0.7) return "confident";
  return "learning";
}

/** Overall mastery across the full 41‑character Koch alphabet.
 * Each character you've reached and assessed (3+ attempts) contributes
 * its accuracy score. Characters you haven't reached yet, or haven't
 * practiced enough to assess, contribute 0.
 *
 * The denominator is always the full alphabet length, so:
 *   • 0 characters assessed  →  0 %  (nothing learned yet)
 *   • 1 character at 80 %   →  2 %  (one out of 41)
 *   • 41 characters at 90 % → 90 %  (near the finish line)
 */
export function overallMasteryPercent(
  symbolStats: Record<string, SymbolStat>,
  lessonIndex: number
): number {
  const pool = KOCH_ORDER.slice(0, Math.max(lessonIndex + 1, 1));
  const total = pool.reduce((sum, char) => {
    const stat = symbolStats[char];
    if (stat && stat.attempts >= 3) {
      return sum + accuracyFor(stat);
    }
    return sum;
  }, 0);

  return Math.round((total / KOCH_ORDER.length) * 100);
}

export interface ConfusionPairDisplay {
  a: string;
  b: string;
  count: number;
}

export function topConfusionPairs(
  confusionPairs: Record<string, number>,
  limit = 5
): ConfusionPairDisplay[] {
  return Object.entries(confusionPairs)
    .map(([key, count]) => {
      const [a, b] = key.split("|");
      return { a, b, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, limit);
}

/** Review interval per mastery tier: lightweight spaced repetition,
 * not a full SM-2 implementation. Mastered symbols can go a few days
 * between reviews; symbols still being learned come back the same day. */
const REVIEW_INTERVAL_MS: Record<MasteryTier, number> = {
  notStarted: 0,
  learning: 8 * 60 * 60 * 1000, // same-day, ~8h
  confident: 2 * 24 * 60 * 60 * 1000, // 2 days
  mastered: 5 * 24 * 60 * 60 * 1000, // 5 days
};

export function isDueForReview(stat: SymbolStat | undefined, now = Date.now()): boolean {
  if (!stat || stat.attempts === 0 || !stat.lastPracticedAt) return false; // never practiced isn't "due", it's "new"
  const tier = tierFor(stat);
  if (tier === "notStarted") return false;
  return now - stat.lastPracticedAt >= REVIEW_INTERVAL_MS[tier];
}

/** Characters the learner has reached and practiced before, that are
 * now due for review under the spacing rule above. */
export function dueForReviewChars(
  symbolStats: Record<string, SymbolStat>,
  lessonIndex: number
): string[] {
  const pool = KOCH_ORDER.slice(0, Math.max(lessonIndex + 1, 1));
  const now = Date.now();
  return pool.filter((char) => isDueForReview(symbolStats[char], now));
}
