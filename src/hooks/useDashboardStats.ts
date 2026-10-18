import { useEffect, useState } from "react";
import i18n from "@/i18n";
import type { DashboardStats } from "@/types/progress";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { getCurrentStreak } from "@/lib/streak";
import { getSessionLog } from "@/lib/sessionLog";
import { overallMasteryPercent } from "@/lib/mastery";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { getTotalXp, computeXpProgress } from "@/lib/xp";
import { getDailyChallenge } from "@/lib/dailyChallenge";
import { getPlayedGames } from "@/lib/highScores";
import { computeBadges } from "@/lib/badges";
import { buildWpmHistory, type WpmRange } from "@/features/dashboard/lib/wpmHistory";

const EMPTY_XP = computeXpProgress(0);

const DAY_KEYS = ["common.daySun", "common.dayMon", "common.dayTue", "common.dayWed", "common.dayThu", "common.dayFri", "common.daySat"];

const RANGES: WpmRange[] = ["week", "month", "all"];

const EMPTY_WPM_BY_RANGE: Record<WpmRange, { label: string; wpm: number }[]> = {
  week: [],
  month: [],
  all: [],
};

const EMPTY_STATS: DashboardStats = {
  streakDays: 0,
  currentLessonChar: "K",
  currentLessonCode: "-.-",
  overallMasteryPct: 0,
  dailyChallenge: { labelKey: "dashboard.dailyChallengeGoal", target: 5, done: 0, total: 5 },
  weakSymbols: [],
  badges: [],
  wpmHistoryByRange: EMPTY_WPM_BY_RANGE,
  xpProgress: EMPTY_XP,
};

/**
 * Everything here comes from saved progress: symbolStats and
 * confusionPairs from useLearnProgress, the streak in lib/streak.ts,
 * the session log, and the XP, badge, and daily-challenge modules.
 * A fresh install shows zeros, which is the correct answer.
 */
export function useDashboardStats() {
  const { loaded, progress, currentChar, lessonIndex } = useLearnProgress();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    (async () => {
      const [streakDays, sessionLog, totalXp, challenge, playedGames] = await Promise.all([
        getCurrentStreak(),
        getSessionLog(),
        getTotalXp(),
        getDailyChallenge(),
        getPlayedGames(),
      ]);
      if (cancelled) return;

      const weakSymbols = Object.entries(progress.symbolStats)
        .filter(([, stat]) => stat.attempts >= 3)
        .map(([char, stat]) => ({
          char,
          code: CHAR_TO_MORSE[char] ?? "",
          accuracy: Math.round((stat.correct / stat.attempts) * 100),
        }))
        .filter((s) => s.accuracy < 80)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);

      const dayLabels = DAY_KEYS.map((k) => i18n.t(k));
      const wpmHistoryByRange = Object.fromEntries(
        RANGES.map((range) => [range, buildWpmHistory(sessionLog, range, { dayLabels })])
      ) as Record<WpmRange, { label: string; wpm: number }[]>;

      const maxWpm = sessionLog.length > 0 ? Math.max(...sessionLog.map((e) => e.wpm)) : 0;
      const xpProgress = computeXpProgress(totalXp);

      setStats({
        streakDays,
        currentLessonChar: currentChar,
        currentLessonCode: CHAR_TO_MORSE[currentChar] ?? "",
        overallMasteryPct: overallMasteryPercent(progress.symbolStats, lessonIndex),
        dailyChallenge: {
          labelKey: "dashboard.dailyChallengeGoal",
          target: challenge.target,
          done: challenge.correctCount,
          total: challenge.target,
        },
        weakSymbols,
        badges: computeBadges({
          lessonIndex,
          symbolStats: progress.symbolStats,
          maxSessionWpm: maxWpm,
          streakDays,
          playedGames,
          level: xpProgress.level,
        }).slice(0, 6),
        wpmHistoryByRange,
        xpProgress,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [loaded, progress, currentChar, lessonIndex]);

  return stats;
}
