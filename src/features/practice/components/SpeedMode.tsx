import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { pickWeightedChar } from "@/lib/practiceEngine";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";
import { appendSessionLog, addPracticeSeconds } from "@/lib/sessionLog";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { playCorrectSfx, playWrongSfx, playComboSfx } from "@/lib/gameSfx";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";
import { ComboBadge } from "@/features/games/components/fx/ComboBadge";
import { GameStat } from "@/features/games/components/fx/GameStat";
import { useCombo } from "@/features/games/hooks/useCombo";
import type { SymbolStat } from "@/types/learn";

interface SpeedModeProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean, actualChar?: string) => void;
}

const SESSION_SECONDS = 30;

export function SpeedMode({ pool, stats, onAnswer }: SpeedModeProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [burstId, setBurstId] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef(0);
  const loggedRef = useRef(false);

  const { combo, best: bestCombo, bump: bumpCombo, reset: resetCombo, resetAll: resetComboAll } = useCombo();

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, timeLeft]);

  // Log the completed session exactly once, with the real final numbers.
  useEffect(() => {
    if (!running && timeLeft === 0 && !loggedRef.current && attemptCount > 0) {
      loggedRef.current = true;
      const finalWpm = Math.round(correctCount / 5 / (SESSION_SECONDS / 60));
      const finalAccuracy = Math.round((correctCount / attemptCount) * 100);
      void appendSessionLog({
        date: new Date().toISOString(),
        wpm: finalWpm,
        accuracy: finalAccuracy,
        source: "speed",
      });
      void addPracticeSeconds(SESSION_SECONDS);
      if (finalAccuracy >= 80) void awardXp(XP_REWARDS.strongSessionBonus);
    }
  }, [running, timeLeft, attemptCount, correctCount]);

  const start = () => {
    setCorrectCount(0);
    setAttemptCount(0);
    loggedRef.current = false;
    setTimeLeft(SESSION_SECONDS);
    startTimeRef.current = Date.now();
    setRunning(true);
    resetComboAll();
    setFeedback("idle");
    const first = pickWeightedChar(pool, stats);
    setCurrent(first);
    play(CHAR_TO_MORSE[first] ?? "");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submit = (value: string) => {
    if (!running || !value) return;
    const typed = value.toUpperCase();
    const correct = typed === current;
    onAnswer(current, correct, typed);
    setAttemptCount((c) => c + 1);
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) {
      setCorrectCount((c) => c + 1);
      const nextCombo = combo + 1;
      bumpCombo();
      setBurstId((b) => b + 1);
      playCorrectSfx();
      if (nextCombo % 5 === 0) playComboSfx(Math.floor(nextCombo / 5));
    } else {
      resetCombo();
      playWrongSfx();
    }
    setInput("");
    const nextChar = pickWeightedChar(pool, stats, current);
    setCurrent(nextChar);
    play(CHAR_TO_MORSE[nextChar] ?? "");
    setTimeout(() => setFeedback("idle"), 200);
  };

  const elapsedMinutes = Math.max((Date.now() - startTimeRef.current) / 60000, 1 / 60);
  const wpm = running || timeLeft === 0 ? Math.round(correctCount / 5 / elapsedMinutes) : 0;
  const accuracy = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;

  if (!running && timeLeft === SESSION_SECONDS) {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <p className="text-body-md text-on-surface-variant">{t("practice.speed.instructions")}</p>
        <Button size="lg" onClick={start} icon={<Icon name="speed" className="w-5 h-5" />}>
          {t("practice.speed.startSession")}
        </Button>
      </Card>
    );
  }

  if (!running && timeLeft === 0) {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("practice.speed.sessionOver")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg w-full max-w-md">
          <GameStat label={t("practice.speed.wpm")} value={wpm} highlight />
          <GameStat label={t("practice.session.correct")} value={correctCount} />
          <GameStat label={t("practice.speed.accuracy")} value={`${accuracy}%`} />
          <GameStat label={t("practice.session.bestStreak")} value={bestCombo} />
        </div>
        <Button onClick={start} icon={<Icon name="refresh" className="w-4 h-4" />}>
          {t("practice.speed.playAgain")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-lg flex flex-col items-center text-center gap-lg relative overflow-hidden">
      <div className="flex justify-between items-center w-full max-w-xs text-sm">
        <span className="text-on-surface-variant">
          {t("practice.speed.timeLeft")}: <strong className="text-on-surface">{timeLeft}s</strong>
        </span>
        <ComboBadge combo={combo} />
        <span className="text-on-surface-variant">
          {t("practice.speed.wpm")}: <strong className="text-primary">{wpm}</strong>
        </span>
      </div>

      <div
        className="w-full max-w-xs h-1.5 bg-surface-container-high rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={timeLeft}
        aria-valuemin={0}
        aria-valuemax={SESSION_SECONDS}
      >
        <div
          className="h-full bg-primary transition-all duration-1000 linear"
          style={{ width: `${(timeLeft / SESSION_SECONDS) * 100}%` }}
        />
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          maxLength={1}
          onChange={(e) => {
            const value = e.target.value.slice(-1);
            setInput(value);
            if (value) submit(value);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          className={cn(
            "w-24 h-24 text-center text-display-lg font-heading-md rounded-xl border-2 bg-surface transition-colors focus:outline-none focus:ring-0",
            feedback === "correct" && "border-primary text-primary",
            feedback === "incorrect" && "border-error text-error",
            feedback === "idle" && "border-outline-variant text-on-surface focus:border-primary"
          )}
        />
        <ParticleBurst burstId={burstId} color="var(--color-primary)" />
      </div>
    </Card>
  );
}
