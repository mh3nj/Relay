import { useCallback, useEffect, useState } from "react";
import { kvGet, kvSet } from "@/lib/db";
import { KOCH_ORDER } from "@/lib/morse";
import { DEFAULT_LEARN_PROGRESS, confusionPairKey } from "@/types/learn";
import type { LearnProgress } from "@/types/learn";
import { markActiveToday } from "@/lib/streak";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { recordDailyChallengeCorrect } from "@/lib/dailyChallenge";
/** Minimum attempts before "Next Character" unlocks, even at perfect
 * accuracy, so a single lucky answer doesn't count as mastery. Matches
 * the "confident"/"mastered" tiers shown on the Progress page, so the
 * gate and the mastery grid always agree on what "learned" means. */
const MIN_ATTEMPTS_TO_ADVANCE = 5;

const KEY = "learnProgress";

export function useLearnProgress() {
  const [progress, setProgress] = useState<LearnProgress>(DEFAULT_LEARN_PROGRESS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    kvGet<LearnProgress>(KEY).then((stored) => {
      if (!cancelled) {
        // Merge with defaults so records saved before confusionPairs
        // existed don't crash when we read them.
        setProgress(
          stored
            ? {
                ...DEFAULT_LEARN_PROGRESS,
                ...stored,
                symbolStats: stored.symbolStats ?? {},
                confusionPairs: stored.confusionPairs ?? {},
              }
            : DEFAULT_LEARN_PROGRESS
        );
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentChar = KOCH_ORDER[progress.currentLessonIndex] ?? KOCH_ORDER[0];

  const goToLesson = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, KOCH_ORDER.length - 1));
      setProgress((prev) => {
        const next = { ...prev, currentLessonIndex: clamped };
        void kvSet(KEY, next);
        return next;
      });
    },
    []
  );

  const nextLesson = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev, currentLessonIndex: Math.min(prev.currentLessonIndex + 1, KOCH_ORDER.length - 1) };
      void kvSet(KEY, next);
      return next;
    });
    void awardXp(XP_REWARDS.lessonAdvance);
  }, []);

  const previousLesson = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev, currentLessonIndex: Math.max(0, prev.currentLessonIndex - 1) };
      void kvSet(KEY, next);
      return next;
    });
  }, []);

  const recordAttempt = useCallback(
    (char: string, correct: boolean, actualChar?: string) => {
      setProgress((prev) => {
        const prevStat = prev.symbolStats[char] ?? { attempts: 0, correct: 0 };
        const nextConfusionPairs = { ...prev.confusionPairs };

        if (!correct && actualChar && actualChar !== char) {
          const key = confusionPairKey(char, actualChar);
          nextConfusionPairs[key] = (nextConfusionPairs[key] ?? 0) + 1;
        }

        const next = {
          ...prev,
          symbolStats: {
            ...prev.symbolStats,
            [char]: {
              attempts: prevStat.attempts + 1,
              correct: prevStat.correct + (correct ? 1 : 0),
              lastPracticedAt: Date.now(),
            },
          },
          confusionPairs: nextConfusionPairs,
        };
        void kvSet(KEY, next);
        return next;
      });
      void markActiveToday();
      void awardXp(correct ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);
      if (correct) void recordDailyChallengeCorrect();
    },
    []
  );

  return {
    loaded,
    progress,
    currentChar,
    lessonIndex: progress.currentLessonIndex,
    totalLessons: KOCH_ORDER.length,
    hasPrevious: progress.currentLessonIndex > 0,
    isLastLesson: progress.currentLessonIndex >= KOCH_ORDER.length - 1,
    readyToAdvance:
      (progress.symbolStats[currentChar]?.correct ?? 0) >= MIN_ATTEMPTS_TO_ADVANCE,
    currentCharStat: progress.symbolStats[currentChar],
    minAttemptsToAdvance: MIN_ATTEMPTS_TO_ADVANCE,
    hasNext:
      progress.currentLessonIndex < KOCH_ORDER.length - 1 &&
      (progress.symbolStats[currentChar]?.correct ?? 0) >= MIN_ATTEMPTS_TO_ADVANCE,
    nextLesson,
    previousLesson,
    goToLesson,
    recordAttempt,
  };
}
