import { useCallback, useEffect, useRef, useState } from "react";
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
import { getHighScore, maybeSetHighScore, markGamePlayed } from "@/lib/highScores";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { playCorrectSfx, playWrongSfx, playComboSfx, playHighScoreSfx } from "@/lib/gameSfx";
import { RingTimer } from "@/features/games/components/fx/RingTimer";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";
import { ComboBadge } from "@/features/games/components/fx/ComboBadge";
import { GameStat } from "@/features/games/components/fx/GameStat";
import { useScreenShake } from "@/features/games/hooks/useScreenShake";
import { useCombo } from "@/features/games/hooks/useCombo";
import type { SymbolStat } from "@/types/learn";

type Difficulty = "easy" | "medium" | "hard";

interface SignalRushProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean, actualChar?: string) => void;
  onExit: () => void;
}

interface DifficultyConfig {
  startWpm: number;
  maxWpm: number;
  startWindow: number;
  minWindow: number;
  maxLives: number;
  wpmIncrement: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { startWpm: 12, maxWpm: 28, startWindow: 5000, minWindow: 1800, maxLives: 5, wpmIncrement: 0.3 },
  medium: { startWpm: 15, maxWpm: 32, startWindow: 4200, minWindow: 1400, maxLives: 3, wpmIncrement: 0.5 },
  hard: { startWpm: 20, maxWpm: 36, startWindow: 3000, minWindow: 1000, maxLives: 2, wpmIncrement: 0.8 },
};

export function SignalRush({ pool, stats, onAnswer, onExit }: SignalRushProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [current, setCurrent] = useState("");
  const [input, setInput] = useState("");
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [wpm, setWpm] = useState(15);
  const [highScore, setHighScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [ringProgress, setRingProgress] = useState(1);
  const [burstId, setBurstId] = useState(0);
  const [lastGain, setLastGain] = useState<{ id: number; points: number } | null>(null);
  const [finalStats, setFinalStats] = useState({ accuracy: 0 });

  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
  });
  const { shaking, trigger: shake } = useScreenShake(360);
  const { combo, best: bestCombo, bump: bumpCombo, reset: resetCombo, resetAll: resetComboAll } = useCombo();
  const inputRef = useRef<HTMLInputElement>(null);
  const configRef = useRef<DifficultyConfig>(DIFFICULTY_CONFIG.medium);
  const startedAt = useRef(0);
  const windowMsRef = useRef(4200);
  const wpmIncrementRef = useRef(0.5);
  const roundTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringFrame = useRef<number | null>(null);
  const roundStartRef = useRef(0);
  const attemptsRef = useRef({ correct: 0, total: 0 });
  const livesRef = useRef(3);
  const gainIdRef = useRef(0);
  // Deferred callbacks (round timeouts) need the live score/WPM, and
  // losing a life must not happen inside a state updater, since React may run
  // an updater more than once, which would cost two lives per mistake.
  const scoreRef = useRef(0);
  const wpmRef = useRef(15);

  useEffect(() => {
    void getHighScore("signalRush").then(setHighScore);
  }, []);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    wpmRef.current = wpm;
  }, [wpm]);

  const stopRing = useCallback(() => {
    if (ringFrame.current) cancelAnimationFrame(ringFrame.current);
    ringFrame.current = null;
  }, []);

  const tickRing = useCallback(() => {
    const elapsed = Date.now() - roundStartRef.current;
    const remaining = Math.max(0, 1 - elapsed / windowMsRef.current);
    setRingProgress(remaining);
    if (remaining > 0) {
      ringFrame.current = requestAnimationFrame(tickRing);
    }
  }, []);

  const endGame = useCallback(
    async (finalScore: number, finalWpm: number) => {
      setPhase("over");
      stopRing();
      if (roundTimeout.current) clearTimeout(roundTimeout.current);
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      const { correct, total } = attemptsRef.current;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      setFinalStats({ accuracy });
      const isHigh = await maybeSetHighScore("signalRush", finalScore);
      setIsNewHigh(isHigh);
      if (isHigh) playHighScoreSfx();
      setHighScore((prev) => Math.max(prev, finalScore));
      void appendSessionLog({
        date: new Date().toISOString(),
        wpm: finalWpm,
        accuracy,
        source: "signalRush",
      });
      void addPracticeSeconds(elapsedSeconds);
      if (accuracy >= 80 && total >= 5) void awardXp(XP_REWARDS.strongSessionBonus);
    },
    [stopRing]
  );

  const loseLife = useCallback(
    (finalScore: number, finalWpm: number) => {
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) {
        void endGame(finalScore, finalWpm);
      }
    },
    [endGame]
  );

  const nextRound = useCallback(
    (prevChar?: string) => {
      const char = pickWeightedChar(pool, stats, prevChar);
      setCurrent(char);
      setInput("");
      setFeedback("idle");
      play(CHAR_TO_MORSE[char] ?? "");
      setTimeout(() => inputRef.current?.focus(), 30);

      roundStartRef.current = Date.now();
      setRingProgress(1);
      stopRing();
      ringFrame.current = requestAnimationFrame(tickRing);

      if (roundTimeout.current) clearTimeout(roundTimeout.current);
      roundTimeout.current = setTimeout(() => {
        attemptsRef.current.total += 1;
        onAnswer(char, false);
        setFeedback("incorrect");
        shake();
        playWrongSfx();
        resetCombo();
        loseLife(scoreRef.current, wpmRef.current);
        setTimeout(() => {
          if (livesRef.current > 0) nextRound(char);
        }, 700);
      }, windowMsRef.current);
    },
    [pool, stats, play, onAnswer, loseLife, stopRing, tickRing, resetCombo, shake]
  );

  const start = (diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    configRef.current = cfg;
    setDifficulty(diff);
    void markGamePlayed("signalRush");
    setLives(cfg.maxLives);
    livesRef.current = cfg.maxLives;
    scoreRef.current = 0;
    setScore(0);
    wpmRef.current = cfg.startWpm;
    setWpm(cfg.startWpm);
    setIsNewHigh(false);
    resetComboAll();
    setBurstId(0);
    setLastGain(null);
    windowMsRef.current = cfg.startWindow;
    wpmIncrementRef.current = cfg.wpmIncrement;
    attemptsRef.current = { correct: 0, total: 0 };
    startedAt.current = Date.now();
    setPhase("playing");
    nextRound();
  };

  useEffect(
    () => () => {
      if (roundTimeout.current) clearTimeout(roundTimeout.current);
      stopRing();
    },
    [stopRing]
  );

  const submit = (value: string) => {
    if (phase !== "playing" || !value) return;
    if (roundTimeout.current) clearTimeout(roundTimeout.current);
    stopRing();

    const typed = value.toUpperCase();
    const correct = typed === current;
    attemptsRef.current.total += 1;
    if (correct) attemptsRef.current.correct += 1;
    onAnswer(current, correct, typed);
    setFeedback(correct ? "correct" : "incorrect");

    if (correct) {
      const nextCombo = combo + 1;
      bumpCombo();
      const points = Math.round(wpm / 2) + Math.min(10, combo);
      gainIdRef.current += 1;
      setLastGain({ id: gainIdRef.current, points });
      setScore((s) => s + points);
      setBurstId((b) => b + 1);
      playCorrectSfx();
      if (nextCombo % 5 === 0) playComboSfx(Math.floor(nextCombo / 5));
      setWpm((w) => Math.min(configRef.current.maxWpm, w + wpmIncrementRef.current));
      windowMsRef.current = Math.max(configRef.current.minWindow, windowMsRef.current - 60);
      setTimeout(() => nextRound(current), 250);
    } else {
      shake();
      playWrongSfx();
      resetCombo();
      loseLife(scoreRef.current, wpmRef.current);
      setTimeout(() => {
        if (livesRef.current > 0) nextRound(current);
      }, 700);
    }
  };

  if (phase === "idle") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg w-full">
        <Icon name="speed" className="w-10 h-10 text-primary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("games.signalRush.title")}
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-md">
          {t("games.signalRush.instructions")}
        </p>
        {highScore > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            {t("games.signalRush.bestScore", { score: highScore })}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full max-w-xs">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <Button key={d} onClick={() => start(d)}>
              {t(`games.signalRush.difficulty.${d}`)}
            </Button>
          ))}
        </div>
        <Button variant="secondary" onClick={onExit}>
          {t("common.back")}
        </Button>
      </Card>
    );
  }

  if (phase === "over") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("practice.speed.sessionOver")}
        </h3>
        {isNewHigh && (
          <p className="text-primary text-sm font-semibold flex items-center gap-xs animate-combo-pop">
            <Icon name="crown" className="w-4 h-4" /> {t("games.newHighScore")}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg w-full max-w-md">
          <GameStat label={t("games.score")} value={score} highlight />
          <GameStat label={t("games.topWpm")} value={Math.round(wpm)} />
          <GameStat label={t("games.accuracy")} value={`${finalStats.accuracy}%`} />
          <GameStat label={t("games.bestCombo")} value={`${bestCombo}\u00d7`} />
        </div>
        <div className="flex gap-md">
          <Button variant="secondary" onClick={onExit}>
            {t("common.back")}
          </Button>
          <Button onClick={() => start(difficulty)} icon={<Icon name="refresh" className="w-4 h-4" />}>
            {t("practice.speed.playAgain")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-lg flex flex-col items-center text-center gap-lg w-full relative overflow-hidden",
        shaking && "animate-game-shake",
        feedback === "incorrect" && "animate-flash-error"
      )}
    >
      <div className="flex justify-between items-center w-full text-sm">
        <div className="flex items-center gap-xs">
          {Array.from({ length: configRef.current.maxLives }).map((_, i) => (
            <Icon
              key={i}
              name="star"
              className={cn("w-4 h-4", i < lives ? "text-tertiary" : "text-outline-variant")}
            />
          ))}
        </div>
        <ComboBadge combo={combo} />
        <span className="text-on-surface-variant">
          {t("games.score")}: <strong className="text-primary">{score}</strong>
        </span>
      </div>

      <div className="relative flex items-center justify-center py-sm">
        <RingTimer progress={ringProgress} size={116} strokeWidth={5} danger={ringProgress < 0.25} />
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
            "absolute w-20 h-20 sm:w-24 sm:h-24 text-center text-display-md sm:text-display-lg font-heading-md rounded-full border-2 bg-surface transition-colors focus:outline-none focus:ring-0",
            feedback === "correct" && "border-primary text-primary",
            feedback === "incorrect" && "border-error text-error",
            feedback === "idle" && "border-outline-variant text-on-surface"
          )}
        />
        <ParticleBurst burstId={burstId} color="var(--color-primary)" />
        {lastGain && (
          <span
            key={lastGain.id}
            className="absolute -top-1 text-label-sm font-semibold text-primary animate-score-float pointer-events-none"
          >
            +{lastGain.points}
          </span>
        )}
      </div>

      <p className="text-label-sm text-on-surface-variant">
        {t("games.signalRush.speedLabel", { wpm: Math.round(wpm) })}
      </p>
    </Card>
  );
}
