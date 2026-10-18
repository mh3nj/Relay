import type { SessionLogEntry } from "@/lib/sessionLog";

export interface WpmDataPoint {
  label: string;
  wpm: number;
}

export type WpmRange = "week" | "month" | "all";

interface BuildWpmHistoryOptions {
  now?: Date;
  /** Localized day-of-week labels, indexed by Date#getDay() (Sun=0). */
  dayLabels: string[];
}

function maxWpm(entries: SessionLogEntry[]): number {
  return entries.length > 0 ? Math.max(...entries.map((e) => e.wpm)) : 0;
}

function shortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function bucketByTrailingWindow(
  sessionLog: SessionLogEntry[],
  now: Date,
  bucketCount: number,
  bucketDays: number
): WpmDataPoint[] {
  const buckets: WpmDataPoint[] = [];
  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * bucketDays);
    const start = new Date(end);
    start.setDate(end.getDate() - (bucketDays - 1));
    start.setHours(0, 0, 0, 0);
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    const entries = sessionLog.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= endOfDay;
    });
    buckets.push({ label: shortDate(end), wpm: maxWpm(entries) });
  }
  return buckets;
}

/**
 * Buckets a session log into chart-ready WPM points for the requested
 * range. Every bucket takes the max WPM of its sessions (not the
 * average) so a single strong run isn't diluted by a slower one right
 * after it.
 *
 * - "week"  -> one bucket per of the last 7 calendar days (labeled by
 *              weekday name).
 * - "month" -> ten 3-day buckets covering the last 30 days.
 * - "all"   -> up to twelve buckets spanning from the earliest logged
 *              session to today, sized so the chart never gets crowded.
 *              Falls back to the empty "week" shape when there's no
 *              history yet, so the chart never renders truly empty.
 */
export function buildWpmHistory(
  sessionLog: SessionLogEntry[],
  range: WpmRange,
  { now = new Date(), dayLabels }: BuildWpmHistoryOptions
): WpmDataPoint[] {
  if (range === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      const dayKey = day.toDateString();
      const entries = sessionLog.filter((e) => new Date(e.date).toDateString() === dayKey);
      return { label: dayLabels[day.getDay()], wpm: maxWpm(entries) };
    });
  }

  if (range === "month") {
    return bucketByTrailingWindow(sessionLog, now, 10, 3);
  }

  // "all"
  if (sessionLog.length === 0) {
    return buildWpmHistory([], "week", { now, dayLabels });
  }
  const earliest = sessionLog.reduce(
    (min, e) => (new Date(e.date) < min ? new Date(e.date) : min),
    new Date(sessionLog[0].date)
  );
  const spanDays = Math.max(7, Math.ceil((now.getTime() - earliest.getTime()) / 86_400_000) + 1);
  const bucketCount = Math.min(12, Math.max(4, Math.ceil(spanDays / 7)));
  const bucketDays = Math.ceil(spanDays / bucketCount);
  return bucketByTrailingWindow(sessionLog, now, bucketCount, bucketDays);
}
