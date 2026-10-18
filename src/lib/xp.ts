import { kvGet, kvSet } from "@/lib/db";

const XP_KEY = "totalXp";

/** Total XP required to REACH a given level from zero. Each level costs
 * progressively more (100, 140, 180, 220…) so leveling up feels earned
 * without gating content behind it. XP is purely a motivational
 * counter layered on top of real practice activity. */
export function xpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += 100 + (l - 1) * 40;
  }
  return total;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface XpProgress {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percentToNextLevel: number;
}

export function computeXpProgress(totalXp: number): XpProgress {
  const level = levelForXp(totalXp);
  const levelStart = xpForLevel(level);
  const levelEnd = xpForLevel(level + 1);
  const xpIntoLevel = totalXp - levelStart;
  const xpForNextLevel = levelEnd - levelStart;
  return {
    totalXp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    percentToNextLevel: xpForNextLevel > 0 ? Math.round((xpIntoLevel / xpForNextLevel) * 100) : 100,
  };
}

export async function getTotalXp(): Promise<number> {
  return (await kvGet<number>(XP_KEY)) ?? 0;
}

/** Adds XP earned from a real event (correct answer, lesson advance,
 * session bonus, challenge completion). Never called speculatively. */
export async function awardXp(amount: number): Promise<number> {
  const current = await getTotalXp();
  const next = current + Math.max(0, Math.round(amount));
  await kvSet(XP_KEY, next);
  return next;
}

export const XP_REWARDS = {
  correctAnswer: 8,
  incorrectAnswer: 1,
  lessonAdvance: 15,
  strongSessionBonus: 25,
  dailyChallengeComplete: 30,
} as const;
