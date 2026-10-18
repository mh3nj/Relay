import { describe, it, expect } from "vitest";
import {
  textToMorse,
  morseToText,
  isValidMorseToken,
  timingForWpm,
  KOCH_ORDER,
  CHAR_TO_MORSE,
  MORSE_TO_CHAR,
  DEFAULT_ALPHABET,
  AMBIGUOUS_MORSE_CODES,
} from "@/lib/morse";

describe("textToMorse / morseToText", () => {
  it("encodes a simple word", () => {
    expect(textToMorse("SOS")).toBe("... --- ...");
  });

  it("round-trips text -> morse -> text", () => {
    const original = "HELLO WORLD";
    const morse = textToMorse(original);
    expect(morseToText(morse)).toBe(original);
  });

  it("separates words with a slash", () => {
    const morse = textToMorse("HI THERE");
    expect(morse).toContain(" / ");
  });

  it("is case-insensitive on encode", () => {
    expect(textToMorse("sos")).toBe(textToMorse("SOS"));
  });

  it("drops characters with no mapping instead of throwing", () => {
    expect(() => textToMorse("HELLO#WORLD")).not.toThrow();
  });

  it("supports a custom dictionary override", () => {
    const custom = { ...CHAR_TO_MORSE, A: "---.." };
    expect(textToMorse("A", custom)).toBe("---..");
    expect(textToMorse("A")).not.toBe("---.."); // default alphabet unaffected
  });

  it("decodes using a custom dictionary override", () => {
    const custom = { ...MORSE_TO_CHAR, "---..": "A" };
    expect(morseToText("---..", custom)).toBe("A");
  });
});

describe("isValidMorseToken", () => {
  it("accepts dot/dash only strings", () => {
    expect(isValidMorseToken(".-")).toBe(true);
    expect(isValidMorseToken("----")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidMorseToken("")).toBe(false);
    expect(isValidMorseToken(".x-")).toBe(false);
    expect(isValidMorseToken("1010")).toBe(false);
  });
});

describe("timingForWpm", () => {
  it("follows the PARIS standard (1200/wpm ms per dit)", () => {
    const timing = timingForWpm(20);
    expect(timing.ditMs).toBeCloseTo(60, 5);
    expect(timing.dahMs).toBeCloseTo(180, 5);
  });

  it("scales inversely with speed", () => {
    const slow = timingForWpm(10);
    const fast = timingForWpm(40);
    expect(slow.ditMs).toBeGreaterThan(fast.ditMs);
  });

  it("stretches spacing under Farnsworth without changing dit/dah length", () => {
    const normal = timingForWpm(20);
    const farnsworth = timingForWpm(20, 10);
    expect(farnsworth.ditMs).toBeCloseTo(normal.ditMs, 5);
    expect(farnsworth.dahMs).toBeCloseTo(normal.dahMs, 5);
    expect(farnsworth.wordGapMs).toBeGreaterThan(normal.wordGapMs);
  });
});

describe("KOCH_ORDER", () => {
  it("contains no duplicates", () => {
    const unique = new Set(KOCH_ORDER);
    expect(unique.size).toBe(KOCH_ORDER.length);
  });

  it("starts with K and M, the traditional Koch method opening pair", () => {
    expect(KOCH_ORDER.slice(0, 2)).toEqual(["K", "M"]);
  });
});

describe("DEFAULT_ALPHABET", () => {
  it("every entry encodes to its own listed code", () => {
    for (const symbol of DEFAULT_ALPHABET) {
      expect(CHAR_TO_MORSE[symbol.char]).toBe(symbol.code);
    }
  });

  it("every entry's code round-trips through the lookup maps, except the two documented real-world collisions", () => {
    for (const symbol of DEFAULT_ALPHABET) {
      if (symbol.code in AMBIGUOUS_MORSE_CODES) continue;
      expect(MORSE_TO_CHAR[symbol.code]).toBe(symbol.char);
    }
  });

  it("decodes each ambiguous code to its documented canonical character", () => {
    for (const [code, char] of Object.entries(AMBIGUOUS_MORSE_CODES)) {
      expect(MORSE_TO_CHAR[code]).toBe(char);
    }
  });
});
