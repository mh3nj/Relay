import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { KOCH_ORDER } from "@/lib/morse";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { useSessionStats } from "@/hooks/useSessionStats";
import { ModeTabs } from "@/features/practice/components/ModeTabs";
import type { PracticeMode } from "@/features/practice/components/ModeTabs";
import { SessionStatsBar } from "@/features/practice/components/SessionStatsBar";
import { HearAndType } from "@/features/practice/components/HearAndType";
import { ReadAndType } from "@/features/practice/components/ReadAndType";
import { TranslateDrill } from "@/features/practice/components/TranslateDrill";
import { Flashcards } from "@/features/practice/components/Flashcards";
import { SpeedMode } from "@/features/practice/components/SpeedMode";
import { EndlessMode } from "@/features/practice/components/EndlessMode";
import { MemoryMode } from "@/features/practice/components/MemoryMode";
import { MorseTreeExplorer } from "@/features/learn/components/MorseTreeExplorer";

export function PracticePage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PracticeMode>("tree");
  const { loaded, progress, lessonIndex, recordAttempt } = useLearnProgress();
  const { stats, accuracy, record } = useSessionStats();
  const [searchParams, setSearchParams] = useSearchParams();

  // Practice only draws from characters the learner has actually reached
  // in the Koch sequence, so drills never quiz something not yet taught.
  const learnedPool = useMemo(
    () => KOCH_ORDER.slice(0, Math.max(lessonIndex + 1, 1)),
    [lessonIndex]
  );

  // A "chars" query param (set by deep links from Dashboard's weak
  // symbols card or Progress's mistake notebook) narrows practice to
  // just those characters. Anything not actually reached yet, or an
  // empty/invalid filter, safely falls back to the full learned pool.
  const focusChars = useMemo(() => {
    const raw = searchParams.get("chars");
    if (!raw) return null;
    const requested = raw
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    const valid = requested.filter((c) => learnedPool.includes(c));
    return valid.length > 0 ? valid : null;
  }, [searchParams, learnedPool]);

  const pool = focusChars ?? learnedPool;

  const clearFocus = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("chars");
    setSearchParams(next, { replace: true });
  };

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        {t("learn.loadingProgress")}
      </div>
    );
  }

  const handleAnswer = (char: string, correct: boolean, actualChar?: string) => {
    record(correct);
    recordAttempt(char, correct, actualChar);
  };

  return (
    <>
      <PageHeader title={t("practice.title")} description={t("practice.description") ?? undefined} />

      {focusChars && (
        <div className="flex items-center justify-between gap-md bg-primary/10 border border-primary/30 rounded-lg px-md py-sm">
          <span className="text-sm text-primary font-medium">
            {t("practice.focusedFilter.label", { chars: focusChars.join(", ") })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFocus}
            icon={<Icon name="close" className="w-4 h-4" />}
          >
            {t("practice.focusedFilter.clear")}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <ModeTabs active={mode} onChange={setMode} />
        <SessionStatsBar stats={stats} accuracy={accuracy} />
      </div>

      <div className="w-full mx-auto reveal-item" key={mode}>
        {mode === "tree" && <MorseTreeExplorer />}
        {mode === "hear" && (
          <HearAndType pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
        {mode === "read" && (
          <ReadAndType pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
        {mode === "translate" && (
          <TranslateDrill pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
        {mode === "flashcards" && (
          <Flashcards pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
        {mode === "speed" && (
          <SpeedMode pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
        {mode === "endless" && (
          <EndlessMode pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
        {mode === "memory" && (
          <MemoryMode pool={pool} stats={progress.symbolStats} onAnswer={handleAnswer} />
        )}
      </div>
    </>
  );
}
