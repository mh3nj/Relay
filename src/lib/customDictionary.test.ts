import { describe, it, expect } from "vitest";
import {
  validateDictionary,
  buildEncodeMap,
  buildDecodeMap,
  parseImportedDictionary,
  exportDictionary,
} from "@/lib/customDictionary";
import { CHAR_TO_MORSE } from "@/lib/morse";
import type { CustomDictionary } from "@/lib/customDictionary";

describe("validateDictionary", () => {
  it("has no issues for a clean dictionary", () => {
    expect(validateDictionary({ A: ".-", B: "-..." })).toHaveLength(0);
  });

  it("flags entries with invalid dot/dash codes", () => {
    const issues = validateDictionary({ A: "1010" });
    expect(issues).toHaveLength(1);
    expect(issues[0].char).toBe("A");
  });

  it("flags two characters sharing the same code as a conflict", () => {
    const issues = validateDictionary({ A: ".-", B: ".-" });
    expect(issues).toHaveLength(1);
    expect(issues[0].conflictsWith).toBe("A");
  });

  it("flags empty codes", () => {
    const issues = validateDictionary({ A: "" });
    expect(issues).toHaveLength(1);
  });
});

describe("buildEncodeMap / buildDecodeMap", () => {
  const dict: CustomDictionary = {
    id: "test",
    name: "Test Dictionary",
    entries: { A: "---.." },
  };

  it("returns the default alphabet unchanged when there's no active dictionary", () => {
    expect(buildEncodeMap(null)).toEqual(CHAR_TO_MORSE);
  });

  it("overrides just the customized characters", () => {
    const encodeMap = buildEncodeMap(dict);
    expect(encodeMap.A).toBe("---..");
    expect(encodeMap.B).toBe(CHAR_TO_MORSE.B); // untouched character still default
  });

  it("decode map is the inverse of the custom entries, merged over default", () => {
    const decodeMap = buildDecodeMap(dict);
    expect(decodeMap["---.."]).toBe("A");
    expect(decodeMap["-..."]).toBe("B"); // default entry preserved
  });
});

describe("export / import round-trip", () => {
  it("parses back what was exported, minus the original id", () => {
    const dict: CustomDictionary = { id: "abc", name: "Mine", entries: { A: ".--." } };
    const json = exportDictionary(dict);
    const parsed = parseImportedDictionary(json);
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe("Mine");
    expect(parsed?.entries).toEqual({ A: ".--." });
    // A fresh id is assigned on import so it can't collide with an
    // existing dictionary of the same original id.
    expect(parsed?.id).not.toBe("abc");
  });

  it("returns null for malformed JSON", () => {
    expect(parseImportedDictionary("not json")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(parseImportedDictionary(JSON.stringify({ foo: "bar" }))).toBeNull();
  });
});
