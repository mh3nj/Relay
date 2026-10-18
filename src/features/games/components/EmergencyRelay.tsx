import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE, DEFAULT_ALPHABET } from "@/lib/morse";
import { appendSessionLog, addPracticeSeconds } from "@/lib/sessionLog";
import { getHighScore, maybeSetHighScore, markGamePlayed } from "@/lib/highScores";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { playCorrectSfx, playWrongSfx, playComboSfx, playHighScoreSfx } from "@/lib/gameSfx";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";
import { ComboBadge } from "@/features/games/components/fx/ComboBadge";
import { GameStat } from "@/features/games/components/fx/GameStat";
import { useScreenShake } from "@/features/games/hooks/useScreenShake";
import { useCombo } from "@/features/games/hooks/useCombo";

type Difficulty = "easy" | "hard";

interface EmergencyRelayProps {
  onExit: () => void;
}

const MAX_LIVES = 3;
const START_TIME_MS = 5000;
const MIN_TIME_MS = 1500;
const PENALTY_MS = 400;

const EASY_POOL = "SOSATNEMRUI".split("");
const HARD_POOL = DEFAULT_ALPHABET.filter(
  (s) => s.category === "letter" || s.category === "number" || s.category === "punctuation"
).map((s) => s.char);

export function EmergencyRelay({ onExit }: EmergencyRelayProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentChar, setCurrentChar] = useState("");
  const [typed, setTyped] = useState("");
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [timeLeft, setTimeLeft] = useState(START_TIME_MS);
  const [flash, setFlash] = useState(false);
  const [blink, setBlink] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const [finalStats, setFinalStats] = useState({ accuracy: 0 });

  const { shaking, trigger: shake } = useScreenShake(320);
  const { combo, best: bestCombo, bump: bumpCombo, reset: resetCombo, resetAll: resetComboAll } = useCombo();

  const baseTimeRef = useRef(START_TIME_MS);
  const startedAt = useRef(0);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const livesRef = useRef(MAX_LIVES);
  const roundTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);
  const keystrokesRef = useRef({ correct: 0, total: 0 });
  // The round timer and scoring must not run side effects from inside a
  // state updater: React may invoke an updater more than once, which
  // would advance two rounds or end the session twice per mistake.
  const scoreRef = useRef(0);

  useEffect(() => {
    void getHighScore("emergencyRelay").then(setHighScore);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  const endGame = useCallback(
    async (finalScore: number) => {
      aliveRef.current = false;
      setPhase("over");
      clearTimer();
      if (roundTimeout.current) clearTimeout(roundTimeout.current);
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      const { correct, total } = keystrokesRef.current;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      setFinalStats({ accuracy });
      const isHigh = await maybeSetHighScore("emergencyRelay", finalScore);
      setIsNewHigh(isHigh);
      if (isHigh) playHighScoreSfx();
      setHighScore((prev) => Math.max(prev, finalScore));
      void appendSessionLog({
        date: new Date().toISOString(),
        wpm: 0,
        accuracy,
        source: "emergencyRelay",
      });
      void addPracticeSeconds(elapsedSeconds);
      if (accuracy >= 80 && total >= 5) void awardXp(XP_REWARDS.strongSessionBonus);
    },
    [clearTimer]
  );

  const pickChar = useCallback((pool: string[], exclude?: string): string => {
    let char: string;
    do {
      char = pool[Math.floor(Math.random() * pool.length)];
    } while (char === exclude && pool.length > 1);
    return char;
  }, []);

  const nextRound = useCallback(
    (prevChar?: string) => {
      const pool = difficulty === "easy" ? EASY_POOL : HARD_POOL;
      const char = pickChar(pool, prevChar);
      setCurrentChar(char);
      setTyped("");
      setTimeLeft(baseTimeRef.current);
      clearTimer();
      timerInterval.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 50));
      }, 50);
      setRound((r) => r + 1);
    },
    [difficulty, pickChar, clearTimer]
  );

  useEffect(() => {
    if (timeLeft <= 0 && phase === "playing") {
      clearTimer();
      if (roundTimeout.current) clearTimeout(roundTimeout.current);
      shake();
      playWrongSfx();
      resetCombo();
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      keystrokesRef.current.total += 1;
      livesRef.current -= 1;
      setLives(livesRef.current);
      baseTimeRef.current = Math.max(MIN_TIME_MS, baseTimeRef.current - PENALTY_MS);
      if (livesRef.current <= 0) {
        void endGame(scoreRef.current);
      } else {
        roundTimeout.current = setTimeout(() => nextRound(currentChar), 600);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, endGame, nextRound, currentChar]);

  useEffect(
    () => () => {
      clearTimer();
      if (roundTimeout.current) clearTimeout(roundTimeout.current);
    },
    [clearTimer]
  );

  const handleSymbol = (symbol: "." | "-") => {
    if (phase !== "playing") return;
    const targetCode = CHAR_TO_MORSE[currentChar] ?? "";
    const attempt = typed + symbol;

    if (!targetCode.startsWith(attempt)) {
      keystrokesRef.current.total += 1;
      shake();
      playWrongSfx();
      resetCombo();
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      baseTimeRef.current = Math.max(MIN_TIME_MS, baseTimeRef.current - PENALTY_MS);
      setTyped("");
      return;
    }

    setTyped(attempt);

    if (attempt === targetCode) {
      keystrokesRef.current.correct += 1;
      keystrokesRef.current.total += 1;
      clearTimer();
      const nextCombo = combo + 1;
      bumpCombo();
      setBurstId((b) => b + 1);
      playCorrectSfx();
      if (nextCombo % 5 === 0) playComboSfx(Math.floor(nextCombo / 5));
      const bonus = Math.max(1, Math.floor(baseTimeRef.current / 500)) + Math.min(10, combo);
      scoreRef.current += 10 + bonus;
      setScore(scoreRef.current);
      baseTimeRef.current = Math.max(MIN_TIME_MS, baseTimeRef.current - 30);
      setTimeout(() => {
        if (aliveRef.current) nextRound(currentChar);
      }, 300);
    }
  };

  const start = (diff: Difficulty) => {
    aliveRef.current = true;
    void markGamePlayed("emergencyRelay");
    setDifficulty(diff);
    setLives(MAX_LIVES);
    livesRef.current = MAX_LIVES;
    scoreRef.current = 0;
    setScore(0);
    setRound(0);
    setIsNewHigh(false);
    resetComboAll();
    setBurstId(0);
    keystrokesRef.current = { correct: 0, total: 0 };
    baseTimeRef.current = START_TIME_MS;
    setTimeLeft(START_TIME_MS);
    startedAt.current = Date.now();
    setPhase("playing");
    setTimeout(() => nextRound(), 200);
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "ControlLeft" || e.key === "." || e.key === "4") {
        e.preventDefault();
        handleSymbol(".");
      } else if (e.code === "ControlRight" || e.key === "-" || e.key === "6") {
        e.preventDefault();
        handleSymbol("-");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentChar, typed]);

  useEffect(() => {
    const b = setInterval(() => {
      if (phase === "playing") setBlink((p) => !p);
    }, 400);
    return () => clearInterval(b);
  }, [phase]);

  if (phase === "idle") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <Icon name="alertTriangle" className="w-10 h-10 text-tertiary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("games.emergencyRelay.title")}
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-sm">
          {t("games.emergencyRelay.instructions")}
        </p>
        {highScore > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            {t("games.emergencyRelay.bestScore", { score: highScore })}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full max-w-xs">
          <Button onClick={() => start("easy")}>{t("games.emergencyRelay.difficulty.easy")}</Button>
          <Button onClick={() => start("hard")}>{t("games.emergencyRelay.difficulty.hard")}</Button>
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
          <GameStat label={t("games.rounds")} value={round} />
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

  const timerPct = baseTimeRef.current > 0 ? (timeLeft / baseTimeRef.current) * 100 : 0;

  return (
    <Card
      className={cn(
        "p-lg flex flex-col gap-lg relative overflow-hidden",
        shaking && "animate-game-shake",
        flash && "animate-flash-error"
      )}
    >
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-xs">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
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

      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-75",
            timerPct > 50 ? "bg-primary" : timerPct > 25 ? "bg-tertiary" : "bg-error"
          )}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div
        className={cn(
          "relative flex flex-col items-center justify-center py-xl rounded-xl border-2 transition-colors duration-75",
          flash ? "border-error/60" : "border-outline-variant/30"
        )}
      >
        <span
          className={cn(
            "font-display-lg text-display-lg transition-opacity duration-200",
            blink ? "opacity-100 text-tertiary" : "opacity-40 text-on-surface",
            flash && "text-error"
          )}
        >
          {currentChar}
        </span>

        {typed && (
          <span className="mt-md font-mono tracking-widest text-on-surface-variant text-lg">
            {typed}
            <span className="opacity-30">{(CHAR_TO_MORSE[currentChar] ?? "").slice(typed.length)}</span>
          </span>
        )}

        <ParticleBurst burstId={burstId} color="var(--color-tertiary)" count={12} />
      </div>

      <div className="flex justify-center gap-md">
        <button
          onClick={() => handleSymbol(".")}
          className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-2xl font-bold text-on-surface hover:bg-primary/10 hover:border-primary transition-colors active:scale-95"
          aria-label={t("learn.dot")}
        >
          •
        </button>
        <button
          onClick={() => handleSymbol("-")}
          className="w-20 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-2xl font-bold text-on-surface hover:bg-primary/10 hover:border-primary transition-colors active:scale-95"
          aria-label={t("learn.dash")}
        >
          -
        </button>
      </div>

      <p className="text-center text-label-sm text-on-surface-variant">
        {t("games.morseInvaders.hint")}
      </p>
    </Card>
  );
}
