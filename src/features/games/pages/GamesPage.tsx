import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import { KOCH_ORDER } from "@/lib/morse";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { getHighScore } from "@/lib/highScores";
import { GameCard } from "@/features/games/components/GameCard";
import { MorseInvaders } from "@/features/games/components/MorseInvaders";
import { SignalRush } from "@/features/games/components/SignalRush";
import { DecodeTranslate } from "@/features/games/components/DecodeTranslate";
import { MorseMatch } from "@/features/games/components/MorseMatch";
import { EmergencyRelay } from "@/features/games/components/EmergencyRelay";

type ActiveGame = "morseInvaders" | "signalRush" | "decodeTranslate" | "morseMatch" | "emergencyRelay" | null;

export function GamesPage() {
  const { t } = useTranslation();
  const { loaded, progress, lessonIndex, recordAttempt } = useLearnProgress();
  const [active, setActive] = useState<ActiveGame>(null);
  const [scores, setScores] = useState({
    morseInvaders: 0,
    signalRush: 0,
    decodeTranslate: 0,
    morseMatch: 0,
    emergencyRelay: 0,
  });

  useEffect(() => {
    void getHighScore("morseInvaders").then((s) =>
      setScores((prev) => ({ ...prev, morseInvaders: s }))
    );
    void getHighScore("signalRush").then((s) => setScores((prev) => ({ ...prev, signalRush: s })));
    void getHighScore("decodeTranslate").then((s) =>
      setScores((prev) => ({ ...prev, decodeTranslate: s }))
    );
    void getHighScore("morseMatch").then((s) =>
      setScores((prev) => ({ ...prev, morseMatch: s }))
    );
    void getHighScore("emergencyRelay").then((s) =>
      setScores((prev) => ({ ...prev, emergencyRelay: s }))
    );
  }, [active]);

  const pool = KOCH_ORDER.slice(0, Math.max(lessonIndex + 1, 1));

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        {t("learn.loadingProgress")}
      </div>
    );
  }

  if (active === "morseInvaders") {
    return (
      <div className="w-full mx-auto">
        <MorseInvaders
          pool={pool}
          stats={progress.symbolStats}
          onAnswer={(char, correct) => recordAttempt(char, correct)}
          onExit={() => setActive(null)}
        />
      </div>
    );
  }

  if (active === "signalRush") {
    return (
      <div className="w-full mx-auto">
        <SignalRush
          pool={pool}
          stats={progress.symbolStats}
          onAnswer={(char, correct, actual) => recordAttempt(char, correct, actual)}
          onExit={() => setActive(null)}
        />
      </div>
    );
  }

  if (active === "decodeTranslate") {
    return (
      <div className="w-full mx-auto">
        <DecodeTranslate onExit={() => setActive(null)} />
      </div>
    );
  }

  if (active === "morseMatch") {
    return (
      <div className="w-full mx-auto">
        <MorseMatch onExit={() => setActive(null)} />
      </div>
    );
  }

  if (active === "emergencyRelay") {
    return (
      <div className="w-full mx-auto">
        <EmergencyRelay onExit={() => setActive(null)} />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t("games.title")} description={t("games.description")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
        <GameCard
          icon="games"
          title={t("games.morseInvaders.title")}
          description={t("games.morseInvaders.cardDescription")}
          highScore={scores.morseInvaders}
          onPlay={() => setActive("morseInvaders")}
        />
        <GameCard
          icon="speed"
          title={t("games.signalRush.title")}
          description={t("games.signalRush.cardDescription")}
          highScore={scores.signalRush}
          onPlay={() => setActive("signalRush")}
        />
        <GameCard
          icon="headphones"
          title={t("games.decodeTranslate.title")}
          description={t("games.decodeTranslate.cardDescription")}
          highScore={scores.decodeTranslate}
          onPlay={() => setActive("decodeTranslate")}
        />
        <GameCard
          icon="brain"
          title={t("games.morseMatch.title")}
          description={t("games.morseMatch.cardDescription")}
          highScore={scores.morseMatch}
          onPlay={() => setActive("morseMatch")}
        />
        <GameCard
          icon="alertTriangle"
          title={t("games.emergencyRelay.title")}
          description={t("games.emergencyRelay.cardDescription")}
          highScore={scores.emergencyRelay}
          onPlay={() => setActive("emergencyRelay")}
        />
      </div>
    </>
  );
}
