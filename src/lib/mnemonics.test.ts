import { describe, it, expect } from "vitest";
import { getMnemonic } from "@/lib/mnemonics";
import { DEFAULT_ALPHABET } from "@/lib/morse";

describe("getMnemonic", () => {
  it("returns real hint text for a known letter", () => {
    const mnemonic = getMnemonic("A");
    expect(mnemonic.hint.length).toBeGreaterThan(0);
    expect(mnemonic.hint).not.toBe("");
  });

  it("splits pipe-separated examples into an array", () => {
    const mnemonic = getMnemonic("A");
    expect(Array.isArray(mnemonic.examples)).toBe(true);
    expect(mnemonic.examples.length).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    expect(getMnemonic("a")).toEqual(getMnemonic("A"));
  });

  it("falls back gracefully for a character with no mnemonic entry", () => {
    const mnemonic = getMnemonic("@");
    expect(mnemonic.examples).toEqual([]);
    expect(mnemonic.hint.length).toBeGreaterThan(0);
  });

  it("has an entry for every letter and digit in the default alphabet", () => {
    for (const symbol of DEFAULT_ALPHABET) {
      if (symbol.category === "punctuation") continue; // punctuation intentionally has no mnemonic
      const mnemonic = getMnemonic(symbol.char);
      expect(mnemonic.hint).not.toBe("");
    }
  });
});
