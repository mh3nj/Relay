import { kvGet, kvSet } from "@/lib/db";

interface UsageWindow {
  windowStart: string; // ISO timestamp
  count: number;
}

const KEY = "aiUsageWindow";
const WINDOW_MS = 24 * 60 * 60 * 1000;

async function getWindow(): Promise<UsageWindow> {
  const stored = await kvGet<UsageWindow>(KEY);
  if (!stored || Date.now() - new Date(stored.windowStart).getTime() > WINDOW_MS) {
    return { windowStart: new Date().toISOString(), count: 0 };
  }
  return stored;
}

export interface RateLimitStatus {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
  allowed: boolean;
}

export async function checkRateLimit(dailyLimit: number): Promise<RateLimitStatus> {
  const win = await getWindow();
  const resetsAt = new Date(new Date(win.windowStart).getTime() + WINDOW_MS);
  return {
    used: win.count,
    limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - win.count),
    resetsAt,
    allowed: win.count < dailyLimit,
  };
}

/** Atomically consume one unit of quota. Call this only immediately
 * before actually sending a request, never speculatively. */
export async function consumeRateLimit(dailyLimit: number): Promise<RateLimitStatus> {
  const win = await getWindow();
  if (win.count >= dailyLimit) {
    return checkRateLimit(dailyLimit);
  }
  const next: UsageWindow = { ...win, count: win.count + 1 };
  await kvSet(KEY, next);
  return checkRateLimit(dailyLimit);
}
