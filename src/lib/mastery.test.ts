import { describe, it, expect } from "vitest";
import {
  accuracyFor,
  tierFor,
  overallMasteryPercent,
  topConfusionPairs,
  isDueForReview,
} from "@/lib/mastery";
import { KOCH_ORDER } from "@/lib/morse";
import type { SymbolStat } from "@/types/learn";

describe("accuracyFor", () => {
  it("returns 0 for an untouched symbol", () => {
    expect(accuracyFor(undefined)).toBe(0);
    expect(accuracyFor({ attempts: 0, correct: 0 })).toBe(0);
  });

  it("computes a plain ratio", () => {
    expect(accuracyFor({ attempts: 4, correct: 3 })).toBe(0.75);
  });
});

describe("tierFor", () => {
  it("is notStarted with no attempts", () => {
    expect(tierFor(undefined)).toBe("notStarted");
  });

  it("is learning with too few attempts even at perfect accuracy", () => {
    expect(tierFor({ attempts: 2, correct: 2 })).toBe("learning");
  });

  it("is mastered at high accuracy with enough attempts", () => {
    expect(tierFor({ attempts: 10, correct: 10 })).toBe("mastered");
  });

  it("is confident in the middle band", () => {
    expect(tierFor({ attempts: 10, correct: 8 })).toBe("confident");
  });

  it("is learning below the confident threshold", () => {
    expect(tierFor({ attempts: 10, correct: 5 })).toBe("learning");
  });
});

describe("overallMasteryPercent", () => {
  it("is 0 with no practice at all", () => {
    expect(overallMasteryPercent({}, 0)).toBe(0);
  });

  it("is 100 only when every character in the full alphabet is mastered", () => {
    const lessonIndex = KOCH_ORDER.length - 1;
    const stats: Record<string, SymbolStat> = {};
    for (const char of KOCH_ORDER) {
      stats[char] = { attempts: 10, correct: 10 };
    }
    expect(overallMasteryPercent(stats, lessonIndex)).toBe(100);
  });

  it("ignores stats for symbols not yet reached in the Koch sequence", () => {
    const farAheadChar = KOCH_ORDER[10];
    const stats: Record<string, SymbolStat> = {
      [farAheadChar]: { attempts: 10, correct: 10 },
    };
    // lessonIndex 0 -> pool is just KOCH_ORDER[0], so mastery should be
    // 0 even though a far-ahead character has perfect stats.
    expect(overallMasteryPercent(stats, 0)).toBe(0);
  });

  it("does not drop when a fresh, unattempted character is reached", () => {
    // Practice only the first character, then advance the lesson. The
    // percentage must not decrease just because a new letter appeared.
    const [first] = KOCH_ORDER;
    const stats: Record<string, SymbolStat> = { [first]: { attempts: 10, correct: 10 } };
    const beforeAdvancing = overallMasteryPercent(stats, 0);
    const afterAdvancing = overallMasteryPercent(stats, 1);
    expect(beforeAdvancing).toBe(afterAdvancing);
  });

  it("requires at least 3 attempts per character before it contributes", () => {
    const [first] = KOCH_ORDER;
    const noAttempts = overallMasteryPercent({ [first]: { attempts: 0, correct: 0 } }, 0);
    const oneAttempt = overallMasteryPercent({ [first]: { attempts: 1, correct: 1 } }, 0);
    const threeAttempts = overallMasteryPercent({ [first]: { attempts: 3, correct: 3 } }, 0);
    const full = KOCH_ORDER.length;

    expect(noAttempts).toBe(0);
    expect(oneAttempt).toBe(0);
    expect(threeAttempts).toBe(Math.round((1 / full) * 100));
  });
});

describe("topConfusionPairs", () => {
  it("sorts by count descending and respects the limit", () => {
    const pairs = { "A|B": 5, "C|D": 9, "E|F": 1 };
    const top = topConfusionPairs(pairs, 2);
    expect(top).toHaveLength(2);
    expect(top[0].count).toBe(9);
    expect(top[1].count).toBe(5);
  });

  it("splits the key into two characters", () => {
    const [pair] = topConfusionPairs({ "H|S": 3 });
    expect([pair.a, pair.b].sort()).toEqual(["H", "S"]);
  });
});

describe("isDueForReview", () => {
  it("is never due for a symbol that's never been practiced", () => {
    expect(isDueForReview(undefined)).toBe(false);
    expect(isDueForReview({ attempts: 0, correct: 0 })).toBe(false);
  });

  it("is due once the tier's interval has elapsed", () => {
    const stat: SymbolStat = {
      attempts: 10,
      correct: 10, // mastered tier -> 5 day interval
      lastPracticedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    };
    expect(isDueForReview(stat)).toBe(true);
  });

  it("is not due if practiced recently", () => {
    const stat: SymbolStat = {
      attempts: 10,
      correct: 10,
      lastPracticedAt: Date.now() - 60 * 1000, // one minute ago
    };
    expect(isDueForReview(stat)).toBe(false);
  });
});
