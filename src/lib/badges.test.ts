import { describe, it, expect } from "vitest";
import { computeBadges } from "@/lib/badges";
import { KOCH_ORDER } from "@/lib/morse";
import type { SymbolStat } from "@/types/learn";

const baseInputs = {
  lessonIndex: 0,
  symbolStats: {} as Record<string, SymbolStat>,
  maxSessionWpm: 0,
  streakDays: 0,
  playedGames: [] as ("morseInvaders" | "signalRush")[],
  level: 1,
};

function findBadge(badges: ReturnType<typeof computeBadges>, id: string) {
  const badge = badges.find((b) => b.id === id);
  if (!badge) throw new Error(`badge ${id} not found`);
  return badge;
}

describe("computeBadges", () => {
  it("nothing is earned from a completely fresh install", () => {
    const badges = computeBadges(baseInputs);
    expect(badges.every((b) => !b.earned)).toBe(true);
  });

  it("first-lesson earns as soon as lessonIndex advances", () => {
    const badges = computeBadges({ ...baseInputs, lessonIndex: 1 });
    expect(findBadge(badges, "first-lesson").earned).toBe(true);
  });

  it("full-alphabet only earns at the very end of the Koch sequence", () => {
    const almostThere = computeBadges({
      ...baseInputs,
      lessonIndex: KOCH_ORDER.length - 2,
    });
    expect(findBadge(almostThere, "full-alphabet").earned).toBe(false);

    const complete = computeBadges({
      ...baseInputs,
      lessonIndex: KOCH_ORDER.length - 1,
    });
    expect(findBadge(complete, "full-alphabet").earned).toBe(true);
  });

  it("wpm badges respect their exact thresholds", () => {
    const at9 = computeBadges({ ...baseInputs, maxSessionWpm: 9 });
    expect(findBadge(at9, "wpm-10").earned).toBe(false);

    const at10 = computeBadges({ ...baseInputs, maxSessionWpm: 10 });
    expect(findBadge(at10, "wpm-10").earned).toBe(true);
    expect(findBadge(at10, "wpm-20").earned).toBe(false);
  });

  it("perfect-ear requires both enough attempts and 100% accuracy", () => {
    const tooFewAttempts = computeBadges({
      ...baseInputs,
      symbolStats: { A: { attempts: 3, correct: 3 } },
    });
    expect(findBadge(tooFewAttempts, "perfect-ear").earned).toBe(false);

    const notPerfect = computeBadges({
      ...baseInputs,
      symbolStats: { A: { attempts: 10, correct: 9 } },
    });
    expect(findBadge(notPerfect, "perfect-ear").earned).toBe(false);

    const earned = computeBadges({
      ...baseInputs,
      symbolStats: { A: { attempts: 10, correct: 10 } },
    });
    expect(findBadge(earned, "perfect-ear").earned).toBe(true);
  });

  it("game-explorer requires both games to have been played", () => {
    const onlyOne = computeBadges({ ...baseInputs, playedGames: ["morseInvaders"] });
    expect(findBadge(onlyOne, "game-explorer").earned).toBe(false);

    const both = computeBadges({
      ...baseInputs,
      playedGames: ["morseInvaders", "signalRush"],
    });
    expect(findBadge(both, "game-explorer").earned).toBe(true);
  });

  it("streak badges stack correctly at their thresholds", () => {
    const badges = computeBadges({ ...baseInputs, streakDays: 7 });
    expect(findBadge(badges, "streak-3").earned).toBe(true);
    expect(findBadge(badges, "streak-7").earned).toBe(true);
    expect(findBadge(badges, "streak-30").earned).toBe(false);
  });

  it("level badges respect their thresholds", () => {
    const badges = computeBadges({ ...baseInputs, level: 5 });
    expect(findBadge(badges, "level-5").earned).toBe(true);
    expect(findBadge(badges, "level-10").earned).toBe(false);
  });
});
