import { describe, it, expect, vi, beforeEach } from "vitest";

// jsdom has no IndexedDB, so the storage layer is mocked. What's under
// test here is backup.ts's own logic (what crosses the file boundary in
// each direction), not IndexedDB itself.
vi.mock("@/lib/db", () => ({
  kvExportAll: vi.fn(),
  kvImportAll: vi.fn(),
  kvGet: vi.fn(),
  kvSet: vi.fn(),
  kvClearAll: vi.fn(),
}));

import { kvExportAll, kvImportAll } from "@/lib/db";
import { buildBackup, isValidBackupFile, restoreBackup, sanitizeBackupData } from "@/lib/backup";

const SECRET_KEYS = ["aiSettings", "autoBackupSnapshot", "lastAutoBackupAt"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sanitizeBackupData", () => {
  it("drops every excluded key and keeps the rest untouched", () => {
    const out = sanitizeBackupData({
      totalXp: 120,
      themeName: "ocean",
      aiSettings: { apiKey: "sk-secret" },
      autoBackupSnapshot: { big: "blob" },
      lastAutoBackupAt: "2026-01-01T00:00:00.000Z",
    });
    expect(out).toEqual({ totalXp: 120, themeName: "ocean" });
  });

  it("does not mutate its input", () => {
    const input = { totalXp: 1, aiSettings: { apiKey: "k" } };
    sanitizeBackupData(input);
    expect(input).toHaveProperty("aiSettings");
  });
});

describe("buildBackup", () => {
  it("never exports the excluded keys, and stamps the envelope", async () => {
    vi.mocked(kvExportAll).mockResolvedValue({
      totalXp: 50,
      aiSettings: { apiKey: "sk-secret" },
      autoBackupSnapshot: {},
      lastAutoBackupAt: "x",
    });
    const backup = await buildBackup();
    expect(backup.app).toBe("relay");
    expect(backup.schemaVersion).toBe(1);
    expect(Object.keys(backup.data)).toEqual(["totalXp"]);
    expect(new Date(backup.exportedAt).toString()).not.toBe("Invalid Date");
  });
});

describe("restoreBackup", () => {
  it("does not let a file overwrite the keys the export leaves out", async () => {
    vi.mocked(kvImportAll).mockResolvedValue(undefined);
    await restoreBackup({
      schemaVersion: 1,
      app: "relay",
      exportedAt: "2026-01-01T00:00:00.000Z",
      data: {
        totalXp: 999,
        aiSettings: { enabled: true, provider: "custom", customEndpoint: "https://evil.example", apiKey: "x" },
        autoBackupSnapshot: { stale: true },
        lastAutoBackupAt: "1999-01-01",
      },
    });
    expect(kvImportAll).toHaveBeenCalledTimes(1);
    const written = vi.mocked(kvImportAll).mock.calls[0][0];
    expect(written).toEqual({ totalXp: 999 });
    for (const key of SECRET_KEYS) expect(written).not.toHaveProperty(key);
  });
});

describe("isValidBackupFile", () => {
  it("accepts a well-formed backup", () => {
    expect(isValidBackupFile({ app: "relay", data: {} })).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "relay"],
    ["wrong app", { app: "other", data: {} }],
    ["missing data", { app: "relay" }],
    ["null data", { app: "relay", data: null }],
    ["array data", { app: "relay", data: [1, 2, 3] }],
  ])("rejects %s", (_label, value) => {
    expect(isValidBackupFile(value)).toBe(false);
  });
});
