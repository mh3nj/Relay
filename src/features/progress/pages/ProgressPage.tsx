import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { getCurrentStreak, getActiveDays } from "@/lib/streak";
import { getSessionLog, getTotalPracticeSeconds } from "@/lib/sessionLog";
import type { SessionLogEntry } from "@/lib/sessionLog";
import { overallMasteryPercent, topConfusionPairs, dueForReviewChars } from "@/lib/mastery";
import { getTotalXp, computeXpProgress } from "@/lib/xp";
import { getPlayedGames } from "@/lib/highScores";
import { computeBadges } from "@/lib/badges";
import { MasteryOverview } from "@/features/progress/components/MasteryOverview";
import { TrendChart } from "@/features/progress/components/TrendChart";
import { CharacterMasteryGrid } from "@/features/progress/components/CharacterMasteryGrid";
import { MistakeNotebook } from "@/features/progress/components/MistakeNotebook";
import { XpLevelCard } from "@/features/progress/components/XpLevelCard";
import { CalendarHeatmap } from "@/features/progress/components/CalendarHeatmap";
import { BadgesGrid } from "@/features/progress/components/BadgesGrid";
import { DueForReviewCard } from "@/features/progress/components/DueForReviewCard";
import { downloadProgressReport } from "@/features/progress/lib/exportReport";

export function ProgressPage() {
  const { t } = useTranslation();
  const { loaded, progress, lessonIndex } = useLearnProgress();
  const [streakDays, setStreakDays] = useState(0);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>([]);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [playedGames, setPlayedGames] = useState<Awaited<ReturnType<typeof getPlayedGames>>>([]);

  useEffect(() => {
    if (!loaded) return;
    void getCurrentStreak().then(setStreakDays);
    void getActiveDays().then(setActiveDays);
    void getSessionLog().then(setSessionLog);
    void getTotalPracticeSeconds().then(setPracticeSeconds);
    void getTotalXp().then(setTotalXp);
    void getPlayedGames().then(setPlayedGames);
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        {t("learn.loadingProgress")}
      </div>
    );
  }

  const masteryPercent = overallMasteryPercent(progress.symbolStats, lessonIndex);
  const confusionPairs = topConfusionPairs(progress.confusionPairs);
  const practiceHours = Math.round((practiceSeconds / 3600) * 10) / 10;
  const xpProgress = computeXpProgress(totalXp);
  const maxSessionWpm = sessionLog.length > 0 ? Math.max(...sessionLog.map((e) => e.wpm)) : 0;
  const badges = computeBadges({
    lessonIndex,
    symbolStats: progress.symbolStats,
    maxSessionWpm,
    streakDays,
    playedGames,
    level: xpProgress.level,
  });
  const dueChars = dueForReviewChars(progress.symbolStats, lessonIndex);

  return (
    <>
      <PageHeader
        title={t("progress.title")}
        description={t("progress.description")}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="download" className="w-4 h-4" />}
            onClick={() =>
              downloadProgressReport(progress, lessonIndex, sessionLog, streakDays, practiceSeconds)
            }
          >
            {t("progress.exportReport")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <MasteryOverview
          percent={masteryPercent}
          practiceHours={practiceHours}
          streakDays={streakDays}
          className="reveal-item"
          style={{ "--reveal-delay": "0ms" } as CSSProperties}
        />
        <TrendChart
          entries={sessionLog}
          className="reveal-item"
          style={{ "--reveal-delay": "60ms" } as CSSProperties}
        />

        <XpLevelCard
          progress={xpProgress}
          className="reveal-item"
          style={{ "--reveal-delay": "120ms" } as CSSProperties}
        />
        <BadgesGrid
          badges={badges}
          className="reveal-item"
          style={{ "--reveal-delay": "160ms" } as CSSProperties}
        />

        <CharacterMasteryGrid
          symbolStats={progress.symbolStats}
          lessonIndex={lessonIndex}
          className="reveal-item"
          style={{ "--reveal-delay": "200ms" } as CSSProperties}
        />

        <DueForReviewCard
          chars={dueChars}
          className="reveal-item"
          style={{ "--reveal-delay": "240ms" } as CSSProperties}
        />
        <MistakeNotebook
          pairs={confusionPairs}
          className="reveal-item"
          style={{ "--reveal-delay": "240ms" } as CSSProperties}
        />

        <CalendarHeatmap
          activeDays={activeDays}
          streakDays={streakDays}
          sessionLog={sessionLog}
          className="reveal-item"
          style={{ "--reveal-delay": "280ms" } as CSSProperties}
        />
      </div>
    </>
  );
}
