import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { pickWeightedChar } from "@/lib/practiceEngine";
import { appendSessionLog, addPracticeSeconds } from "@/lib/sessionLog";
import { getHighScore, maybeSetHighScore, markGamePlayed } from "@/lib/highScores";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { playCorrectSfx, playWrongSfx, playComboSfx, playHighScoreSfx } from "@/lib/gameSfx";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";
import { ComboBadge } from "@/features/games/components/fx/ComboBadge";
import { GameStat } from "@/features/games/components/fx/GameStat";
import { useScreenShake } from "@/features/games/hooks/useScreenShake";
import { useCombo } from "@/features/games/hooks/useCombo";
import type { SymbolStat } from "@/types/learn";

type Difficulty = "easy" | "medium" | "hard";

interface MorseInvadersProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean) => void;
  onExit: () => void;
}

interface Invader {
  id: number;
  char: string;
  code: string;
  y: number; // 0-100, percent from top
  x: number; // 0-100, percent from left
  spawnedAt: number;
}

interface DifficultyConfig {
  initialFall: number;
  initialSpawn: number;
  minSpawn: number;
  maxLives: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { initialFall: 0.2, initialSpawn: 3000, minSpawn: 1200, maxLives: 5 },
  medium: { initialFall: 0.35, initialSpawn: 2200, minSpawn: 900, maxLives: 3 },
  hard: { initialFall: 0.5, initialSpawn: 1500, minSpawn: 600, maxLives: 2 },
};

const TICK_MS = 60;

export function MorseInvaders({ pool, stats, onAnswer, onExit }: MorseInvadersProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [typed, setTyped] = useState("");
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [destroyed, setDestroyed] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [killBurst, setKillBurst] = useState<{ id: number; x: number; y: number } | null>(null);
  const [finalStats, setFinalStats] = useState({ accuracy: 0 });

  const { shaking, trigger: shake } = useScreenShake(300);
  const { combo, best: bestCombo, bump: bumpCombo, reset: resetCombo, resetAll: resetComboAll } = useCombo();

  const nextId = useRef(0);
  const burstIdRef = useRef(0);
  // The falling-field state, lives and score are mirrored in refs so the
  // game loop can read and update them without performing side effects
  // inside a state updater (React may run an updater more than once).
  const invadersRef = useRef<Invader[]>([]);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const configRef = useRef<DifficultyConfig>(DIFFICULTY_CONFIG.medium);
  const fallSpeedRef = useRef(0.35);
  const spawnMsRef = useRef(2200);
  const startedAt = useRef(0);
  const destroyedRef = useRef(0);
  const keystrokesRef = useRef({ correct: 0, total: 0 });
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void getHighScore("morseInvaders").then(setHighScore);
  }, []);

  const spawn = useCallback(() => {
    const char = pickWeightedChar(pool, stats);
    const x = 10 + Math.random() * 80;
    invadersRef.current = [
      ...invadersRef.current,
      {
        id: nextId.current++,
        char,
        code: CHAR_TO_MORSE[char] ?? "",
        y: -(Math.random() * 20),
        x,
        spawnedAt: Date.now(),
      },
    ];
    setInvaders(invadersRef.current);
    spawnMsRef.current = Math.max(configRef.current.minSpawn, spawnMsRef.current - 30);
    spawnTimeout.current = setTimeout(spawn, spawnMsRef.current);
  }, [pool, stats]);

  const endGame = useCallback(async (finalScore: number, finalDestroyed: number) => {
    setPhase("over");
    if (tickInterval.current) clearInterval(tickInterval.current);
    if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const wpm = Math.round(finalDestroyed / 5 / (elapsedSeconds / 60));
    const { correct, total } = keystrokesRef.current;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    setFinalStats({ accuracy });
    const isHigh = await maybeSetHighScore("morseInvaders", finalScore);
    setIsNewHigh(isHigh);
    if (isHigh) playHighScoreSfx();
    setHighScore((prev) => Math.max(prev, finalScore));
    void appendSessionLog({
      date: new Date().toISOString(),
      wpm,
      accuracy,
      source: "morseInvaders",
    });
    void addPracticeSeconds(elapsedSeconds);
    if (accuracy >= 80 && finalDestroyed >= 5) void awardXp(XP_REWARDS.strongSessionBonus);
  }, []);

  const start = (diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    configRef.current = cfg;
    setDifficulty(diff);
    void markGamePlayed("morseInvaders");
    invadersRef.current = [];
    setInvaders([]);
    setTyped("");
    livesRef.current = cfg.maxLives;
    setLives(cfg.maxLives);
    scoreRef.current = 0;
    setScore(0);
    setDestroyed(0);
    destroyedRef.current = 0;
    keystrokesRef.current = { correct: 0, total: 0 };
    setIsNewHigh(false);
    resetComboAll();
    setKillBurst(null);
    fallSpeedRef.current = cfg.initialFall;
    spawnMsRef.current = cfg.initialSpawn;
    startedAt.current = Date.now();
    setPhase("playing");

    tickInterval.current = setInterval(() => {
      const survivors: Invader[] = [];
      let missed = 0;
      for (const inv of invadersRef.current) {
        const nextY = inv.y + fallSpeedRef.current;
        if (nextY >= 100) {
          missed++;
        } else {
          survivors.push({ ...inv, y: nextY });
        }
      }
      invadersRef.current = survivors;
      setInvaders(survivors);

      if (missed > 0) {
        resetCombo();
        shake();
        playWrongSfx();
        livesRef.current = Math.max(0, livesRef.current - missed);
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          void endGame(scoreRef.current, destroyedRef.current);
        }
      }
    }, TICK_MS);

    spawnTimeout.current = setTimeout(spawn, 800);
  };

  useEffect(
    () => () => {
      if (tickInterval.current) clearInterval(tickInterval.current);
      if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
    },
    []
  );

  const handleSymbol = (symbol: "." | "-") => {
    if (phase !== "playing" || invaders.length === 0) return;
    const target = invaders[0];
    const attempt = typed + symbol;

    if (!target.code.startsWith(attempt)) {
      keystrokesRef.current.total += 1;
      shake();
      playWrongSfx();
      resetCombo();
      setTyped("");
      onAnswer(target.char, false);
      return;
    }

    keystrokesRef.current.total += 1;
    keystrokesRef.current.correct += 1;

    if (attempt === target.code) {
      const nextCombo = combo + 1;
      bumpCombo();
      invadersRef.current = invadersRef.current.filter((i) => i.id !== target.id);
      setInvaders(invadersRef.current);
      setTyped("");
      const points = 10 + Math.min(20, combo * 2);
      scoreRef.current += points;
      setScore(scoreRef.current);
      destroyedRef.current += 1;
      setDestroyed(destroyedRef.current);
      burstIdRef.current += 1;
      setKillBurst({ id: burstIdRef.current, x: target.x, y: target.y });
      playCorrectSfx();
      if (nextCombo % 5 === 0) playComboSfx(Math.floor(nextCombo / 5));
      onAnswer(target.char, true);
      fallSpeedRef.current = Math.min(1.2, fallSpeedRef.current + 0.02);
    } else {
      setTyped(attempt);
    }
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
  }, [phase, invaders, typed]);

  if (phase === "idle") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg w-full">
        <Icon name="games" className="w-10 h-10 text-primary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("games.morseInvaders.title")}
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-md">
          {t("games.morseInvaders.instructions")}
        </p>
        {highScore > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            {t("games.morseInvaders.bestScore", { score: highScore })}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full max-w-xs">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <Button key={d} onClick={() => start(d)}>
              {t(`games.morseInvaders.difficulty.${d}`)}
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
          <GameStat label={t("games.morseInvaders.destroyedLabel")} value={destroyed} />
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
    <Card className="p-lg flex flex-col gap-md w-full">
      <div className="flex justify-between items-center text-sm">
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

      <div
        className={cn(
          "relative w-full min-h-[50vh] max-h-[70vh] bg-waveform-well rounded-lg border border-outline-variant/30 overflow-hidden",
          shaking && "animate-game-shake"
        )}
      >
        {invaders.map((inv, i) => (
          <div
            key={inv.id}
            className={cn(
              "absolute flex flex-col items-center transition-none",
              i === 0 ? "z-10" : "z-0"
            )}
            style={{ top: `${inv.y}%`, left: `${inv.x}%` }}
          >
            <span
              className={cn(
                "text-2xl font-bold",
                i === 0 ? "text-primary" : "text-on-surface-variant/60"
              )}
            >
              {inv.char}
            </span>
            {i === 0 && (
              <span className="font-morse-code text-sm text-primary/70 tracking-widest">
                {typed}
                <span className="opacity-30">{inv.code.slice(typed.length)}</span>
              </span>
            )}
          </div>
        ))}
        {killBurst && (
          <div
            key={killBurst.id}
            className="absolute"
            style={{ top: `${killBurst.y}%`, left: `${killBurst.x}%` }}
          >
            <ParticleBurst burstId={killBurst.id} color="var(--color-tertiary)" count={12} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-error/50" />
      </div>

      <div className="flex justify-center gap-md">
        <button
          onClick={() => handleSymbol(".")}
          className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-2xl font-bold text-on-surface hover:bg-primary/10 hover:border-primary transition-colors active:scale-95"
          aria-label={t("games.morseInvaders.dot") ?? ""}
        >
          •
        </button>
        <button
          onClick={() => handleSymbol("-")}
          className="w-20 h-16 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-2xl font-bold text-on-surface hover:bg-primary/10 hover:border-primary transition-colors active:scale-95"
          aria-label={t("games.morseInvaders.dash") ?? ""}
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
