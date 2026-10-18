import { downloadJson } from "@/lib/exportUtils";
import { overallMasteryPercent, topConfusionPairs } from "@/lib/mastery";
import type { LearnProgress } from "@/types/learn";
import type { SessionLogEntry } from "@/lib/sessionLog";

export function downloadProgressReport(
  progress: LearnProgress,
  lessonIndex: number,
  sessionLog: SessionLogEntry[],
  streakDays: number,
  practiceSeconds: number
) {
  const report = {
    exportedAt: new Date().toISOString(),
    overallMasteryPercent: overallMasteryPercent(progress.symbolStats, lessonIndex),
    currentStreakDays: streakDays,
    totalPracticeMinutes: Math.round(practiceSeconds / 60),
    symbolStats: progress.symbolStats,
    confusingPairs: topConfusionPairs(progress.confusionPairs, 10),
    recentSessions: sessionLog.slice(-30),
  };
  downloadJson(report, `relay-progress-report-${report.exportedAt.slice(0, 10)}.json`);
}
