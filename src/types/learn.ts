export interface SymbolStat {
  attempts: number;
  correct: number;
  /** Epoch ms of the most recent attempt. Drives the spaced-repetition
   * "due for review" calculation. Optional so older stored records
   * without it still parse fine. */
  lastPracticedAt?: number;
}

export interface LearnProgress {
  schemaVersion: 1;
  /** Index into KOCH_ORDER of the character currently being learned. */
  currentLessonIndex: number;
  symbolStats: Record<string, SymbolStat>;
  /** Keyed by two characters joined with "|" in alphabetical order (e.g.
   * "H|S"), so a mix-up in either direction counts once. Filled from
   * wrong answers in Practice. */
  confusionPairs: Record<string, number>;
}

export const DEFAULT_LEARN_PROGRESS: LearnProgress = {
  schemaVersion: 1,
  currentLessonIndex: 0,
  symbolStats: {},
  confusionPairs: {},
};

export function confusionPairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}
