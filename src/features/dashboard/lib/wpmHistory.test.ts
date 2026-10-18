import { describe, it, expect } from "vitest";
import { buildWpmHistory } from "./wpmHistory";
import type { SessionLogEntry } from "@/lib/sessionLog";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NOW = new Date("2026-08-25T12:00:00Z");

function entry(date: string, wpm: number): SessionLogEntry {
  return { date, wpm, accuracy: 100, source: "speed" };
}

describe("buildWpmHistory", () => {
  it("returns one point per day for the week range", () => {
    const result = buildWpmHistory([], "week", { now: NOW, dayLabels: DAY_LABELS });
    expect(result).toHaveLength(7);
  });

  it("takes the max WPM per day, not the average", () => {
    const log = [entry("2026-08-25T08:00:00Z", 12), entry("2026-08-25T09:00:00Z", 20)];
    const result = buildWpmHistory(log, "week", { now: NOW, dayLabels: DAY_LABELS });
    expect(result[result.length - 1].wpm).toBe(20);
  });

  it("ignores sessions outside the requested week", () => {
    const log = [entry("2026-01-01T08:00:00Z", 40)];
    const result = buildWpmHistory(log, "week", { now: NOW, dayLabels: DAY_LABELS });
    expect(result.every((p) => p.wpm === 0)).toBe(true);
  });

  it("returns ten buckets for the month range", () => {
    const result = buildWpmHistory([], "month", { now: NOW, dayLabels: DAY_LABELS });
    expect(result).toHaveLength(10);
  });

  it("falls back to the empty week shape for 'all' with no history", () => {
    const result = buildWpmHistory([], "all", { now: NOW, dayLabels: DAY_LABELS });
    expect(result).toHaveLength(7);
    expect(result.every((p) => p.wpm === 0)).toBe(true);
  });

  it("spans from the earliest session to today for 'all'", () => {
    const log = [entry("2026-06-01T12:00:00Z", 15), entry("2026-08-20T12:00:00Z", 30)];
    const result = buildWpmHistory(log, "all", { now: NOW, dayLabels: DAY_LABELS });
    expect(result.length).toBeGreaterThan(1);
    expect(result.length).toBeLessThanOrEqual(12);
    const total = result.reduce((sum, p) => sum + p.wpm, 0);
    expect(total).toBeGreaterThan(0);
    // The most recent bucket should be the one carrying the later session.
    expect(result[result.length - 1].wpm).toBeGreaterThan(0);
  });
});
