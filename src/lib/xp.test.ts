import { describe, it, expect } from "vitest";
import { xpForLevel, levelForXp, computeXpProgress } from "@/lib/xp";

describe("xpForLevel", () => {
  it("requires zero XP to reach level 1", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("increases monotonically", () => {
    let prev = xpForLevel(1);
    for (let level = 2; level <= 15; level++) {
      const current = xpForLevel(level);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });

  it("costs progressively more per level (accelerating curve)", () => {
    const gap2to3 = xpForLevel(3) - xpForLevel(2);
    const gap9to10 = xpForLevel(10) - xpForLevel(9);
    expect(gap9to10).toBeGreaterThan(gap2to3);
  });
});

describe("levelForXp", () => {
  it("is level 1 at zero XP", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("reaches exactly `level` at that level's threshold, and falls short one XP earlier", () => {
    for (let level = 2; level <= 8; level++) {
      const threshold = xpForLevel(level);
      expect(levelForXp(threshold)).toBeGreaterThanOrEqual(level);
      expect(levelForXp(threshold - 1)).toBeLessThan(level);
    }
  });

  it("never returns a level whose threshold exceeds the given XP", () => {
    const xp = 500;
    const level = levelForXp(xp);
    expect(xpForLevel(level)).toBeLessThanOrEqual(xp);
  });
});

describe("computeXpProgress", () => {
  it("starts at 0% into level 1 with no XP", () => {
    const progress = computeXpProgress(0);
    expect(progress.level).toBe(1);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.percentToNextLevel).toBe(0);
  });

  it("percentToNextLevel is between 0 and 100", () => {
    for (const xp of [0, 50, 150, 500, 2000]) {
      const progress = computeXpProgress(xp);
      expect(progress.percentToNextLevel).toBeGreaterThanOrEqual(0);
      expect(progress.percentToNextLevel).toBeLessThanOrEqual(100);
    }
  });

  it("totalXp round-trips unchanged", () => {
    expect(computeXpProgress(1234).totalXp).toBe(1234);
  });
});
