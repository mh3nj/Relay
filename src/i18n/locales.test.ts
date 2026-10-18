import { describe, it, expect } from "vitest";

type Tree = { [key: string]: string | Tree };

// Every locale file, bundled by Vite. No Node fs/path needed (this project
// has no Node type definitions, and `tsc -b` is part of the build).
const modules = import.meta.glob<{ default: Tree }>("./locales/*.json", { eager: true });
const files = Object.fromEntries(
  Object.entries(modules).map(([modulePath, mod]) => [modulePath.replace("./locales/", ""), mod.default]),
);

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") out[prefix + key] = value;
    else Object.assign(out, flatten(value, `${prefix}${key}.`));
  }
  return out;
}

const load = (file: string) => flatten(files[file]);
const placeholders = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort();

const en = load("en.json");
const others = Object.keys(files).filter((f) => f !== "en.json");

describe("locale files stay in step with en.json", () => {
  it("finds the non-English locales", () => {
    expect(others.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of others) {
    it(`${file} has exactly the same keys as en.json`, () => {
      const keys = Object.keys(load(file));
      expect(Object.keys(en).filter((k) => !keys.includes(k))).toEqual([]);
      expect(keys.filter((k) => !(k in en))).toEqual([]);
    });

    it(`${file} keeps every {{placeholder}} intact and has no empty strings`, () => {
      const t = load(file);
      const bad = Object.keys(en).filter(
        (k) => k in t && (placeholders(en[k]).join() !== placeholders(t[k]).join() || (!t[k].trim() && en[k].trim())),
      );
      expect(bad).toEqual([]);
    });
  }
});
