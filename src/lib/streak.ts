import { kvGet, kvSet } from "@/lib/db";

/**
 * Which calendar days (local time, "YYYY-MM-DD") someone practiced on.
 * Dashboard and Progress compute their streak from this list.
 */

const KEY = "activeDays";
const MAX_STORED_DAYS = 400;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Marks today as an active day. Safe to call on every practice
 * attempt. It's a no-op if today is already recorded. */
export async function markActiveToday(): Promise<void> {
  const days = (await kvGet<string[]>(KEY)) ?? [];
  const today = dateKey(new Date());
  if (days[days.length - 1] === today) return;
  const next = [...days, today].slice(-MAX_STORED_DAYS);
  await kvSet(KEY, next);
}

/** Current streak: consecutive active days ending today or yesterday
 * (yesterday still counts so the streak doesn't reset the instant the
 * clock rolls over before today's first practice). */
/** Raw list of active-day keys, oldest first, for the calendar heatmap. */
export async function getActiveDays(): Promise<string[]> {
  return (await kvGet<string[]>(KEY)) ?? [];
}

export async function getCurrentStreak(): Promise<number> {
  const days = (await kvGet<string[]>(KEY)) ?? [];
  if (days.length === 0) return 0;

  const daySet = new Set(days);
  const cursor = new Date();
  const today = dateKey(cursor);

  if (!daySet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!daySet.has(dateKey(cursor))) return 0;
  }

  let streak = 0;
  for (;;) {
    if (!daySet.has(dateKey(cursor))) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
