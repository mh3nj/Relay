import type { SymbolStat } from "@/types/learn";

/**
 * Picks the next practice character with weighted randomness: symbols
 * with lower recorded accuracy (or no attempts yet) are more likely to
 * come up, so practice naturally drills weak spots instead of cycling
 * uniformly through everything that's been learned.
 */
export function pickWeightedChar(
  pool: string[],
  stats: Record<string, SymbolStat>,
  exclude?: string
): string {
  const candidates = pool.length > 1 ? pool.filter((c) => c !== exclude) : pool;

  const weights = candidates.map((char) => {
    const stat = stats[char];
    if (!stat || stat.attempts === 0) return 3; // unseen symbols get priority
    const accuracy = stat.correct / stat.attempts;
    // Accuracy 0% -> weight 3, accuracy 100% -> weight 0.3
    return Math.max(0.3, 3 - accuracy * 2.7);
  });

  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
