import { describe, it, expect } from "vitest";
import { pickWeightedChar } from "@/lib/practiceEngine";
import type { SymbolStat } from "@/types/learn";

describe("pickWeightedChar", () => {
  it("only ever returns a character from the pool", () => {
    const pool = ["A", "B", "C"];
    for (let i = 0; i < 50; i++) {
      expect(pool).toContain(pickWeightedChar(pool, {}));
    }
  });

  it("returns the only character when the pool has one entry", () => {
    expect(pickWeightedChar(["A"], {})).toBe("A");
  });

  it("avoids immediately repeating the excluded character when possible", () => {
    const pool = ["A", "B"];
    for (let i = 0; i < 50; i++) {
      expect(pickWeightedChar(pool, {}, "A")).toBe("B");
    }
  });

  it("still returns a value when exclude is the only pool entry", () => {
    expect(pickWeightedChar(["A"], {}, "A")).toBe("A");
  });

  it("statistically favors characters with lower accuracy", () => {
    const pool = ["WEAK", "STRONG"];
    const stats: Record<string, SymbolStat> = {
      WEAK: { attempts: 20, correct: 2 }, // 10% accuracy
      STRONG: { attempts: 20, correct: 19 }, // 95% accuracy
    };

    let weakCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      if (pickWeightedChar(pool, stats) === "WEAK") weakCount++;
    }

    // Not a fixed ratio (it's randomized), but weak should come up
    // noticeably more than half the time given the weighting formula.
    expect(weakCount / trials).toBeGreaterThan(0.6);
  });

  it("prioritizes never-attempted characters over practiced ones", () => {
    const pool = ["NEW", "PRACTICED"];
    const stats: Record<string, SymbolStat> = {
      PRACTICED: { attempts: 20, correct: 20 }, // 100% accuracy, fully mastered
    };

    let newCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      if (pickWeightedChar(pool, stats) === "NEW") newCount++;
    }

    expect(newCount / trials).toBeGreaterThan(0.7);
  });
});
