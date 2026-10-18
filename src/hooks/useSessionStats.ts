import { useCallback, useState } from "react";

export interface SessionStats {
  correct: number;
  attempts: number;
  streak: number;
  bestStreak: number;
}

const INITIAL: SessionStats = { correct: 0, attempts: 0, streak: 0, bestStreak: 0 };

export function useSessionStats() {
  const [stats, setStats] = useState<SessionStats>(INITIAL);

  const record = useCallback((correct: boolean) => {
    setStats((prev) => {
      const streak = correct ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (correct ? 1 : 0),
        attempts: prev.attempts + 1,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      };
    });
  }, []);

  const reset = useCallback(() => setStats(INITIAL), []);

  const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;

  return { stats, accuracy, record, reset };
}
