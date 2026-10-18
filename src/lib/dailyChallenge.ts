import { kvGet, kvSet } from "@/lib/db";
import { awardXp, XP_REWARDS } from "@/lib/xp";

const KEY = "dailyChallenge";

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  correctCount: number;
  target: number;
  completed: boolean;
  xpAwarded: boolean;
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

/** Deterministic 5-8 target that varies by day without any server, so
 * every device generates the same challenge for the same date. */
function targetForDate(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return 5 + (hash % 4);
}

function freshState(dateKey: string): DailyChallengeState {
  return {
    date: dateKey,
    correctCount: 0,
    target: targetForDate(dateKey),
    completed: false,
    xpAwarded: false,
  };
}

/** Reads today's challenge, auto-resetting if the stored record is from
 * a previous day. */
export async function getDailyChallenge(): Promise<DailyChallengeState> {
  const today = todayKey();
  const stored = await kvGet<DailyChallengeState>(KEY);
  if (!stored || stored.date !== today) {
    const fresh = freshState(today);
    await kvSet(KEY, fresh);
    return fresh;
  }
  return stored;
}

/** Called on every real correct practice/game answer. Awards the
 * completion XP exactly once, the moment the target is actually met. */
export async function recordDailyChallengeCorrect(): Promise<DailyChallengeState> {
  const state = await getDailyChallenge();
  if (state.completed) return state;

  const next: DailyChallengeState = {
    ...state,
    correctCount: state.correctCount + 1,
  };
  next.completed = next.correctCount >= next.target;

  if (next.completed && !next.xpAwarded) {
    next.xpAwarded = true;
    await awardXp(XP_REWARDS.dailyChallengeComplete);
  }

  await kvSet(KEY, next);
  return next;
}
