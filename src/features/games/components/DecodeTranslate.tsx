import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { textToMorse } from "@/lib/morse";
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

type Difficulty = "easy" | "medium" | "hard";

interface DecodeTranslateProps {
  onExit: () => void;
}

const WORDS: Record<Difficulty, string[]> = {
  easy: "DOG CAT SUN RUN BIG HOT RED BOX FUN OLD NEW YES WIN TOP CUP HAT PEN MAP SIT JAM".split(" "),
  medium: "HELLO WORLD MORSE RADIO LIGHT WATER BRAIN DANCE FLAME HOUSE CLOCK GREEN MUSIC PEACE STORM CLOUD OCEAN TOWER BRIDGE RIVER".split(" "),
  hard: "SOS MAYDAY HELP ME SEND HELP NEED WATER COMING HOME DANGER CODE RED ALL CLEAR SITUATION REPORT MEDICAL EMERGENCY EVACUATE NOW HOLD POSITION".split(" "),
};

const START_WINDOW_MS = 8000;
const MIN_WINDOW_MS = 3000;

export function DecodeTranslate({ onExit }: DecodeTranslateProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const defaultWpm = audioDefaults.wpm;
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentWord, setCurrentWord] = useState("");
  const [morseSequence, setMorseSequence] = useState("");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [feedbackWord, setFeedbackWord] = useState("");
  const [timeLeft, setTimeLeft] = useState(START_WINDOW_MS);
  const [burstId, setBurstId] = useState(0);
  const [finalStats, setFinalStats] = useState({ accuracy: 0 });

  const { play, stop } = useMorsePlayer(defaultWpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const { shaking, trigger: shake } = useScreenShake(360);
  const { combo, best: bestCombo, bump: bumpCombo, reset: resetCombo, resetAll: resetComboAll } = useCombo();
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const windowRef = useRef(START_WINDOW_MS);
  const aliveRef = useRef(true);
  const stopped = useRef(false);
  const attemptsRef = useRef({ correct: 0, total: 0 });
  // Kept in a ref so the session can be ended from a timeout or an effect
  // with the live score, and so scoring never mutates other state from
  // inside a setScore updater (React may run an updater more than once).
  const scoreRef = useRef(0);

  useEffect(() => {
    void getHighScore("decodeTranslate").then(setHighScore);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const nextWord = useCallback(
    (prevWord?: string) => {
      const pool = WORDS[difficulty];
      let word: string;
      do {
        word = pool[Math.floor(Math.random() * pool.length)];
      } while (word === prevWord && pool.length > 1);

      const morse = textToMorse(word, undefined);
      setCurrentWord(word);
      setMorseSequence(morse);
      setInput("");
      setFeedback("idle");
      setFeedbackWord("");

      setTimeout(() => {
        play(morse);
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 100);

      setTimeLeft(windowRef.current);
      clearTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 100));
      }, 100);
    },
    [difficulty, play, clearTimer]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const endGame = useCallback(
    async (finalScore: number) => {
      aliveRef.current = false;
      setPhase("over");
      clearTimer();
      stop();
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      const { correct, total } = attemptsRef.current;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      setFinalStats({ accuracy });
      const isHigh = await maybeSetHighScore("decodeTranslate", finalScore);
      setIsNewHigh(isHigh);
      if (isHigh) playHighScoreSfx();
      setHighScore((prev) => Math.max(prev, finalScore));
      void appendSessionLog({
        date: new Date().toISOString(),
        wpm: defaultWpm,
        accuracy,
        source: "decodeTranslate",
      });
      void addPracticeSeconds(elapsedSeconds);
      if (accuracy >= 80 && total >= 5) void awardXp(XP_REWARDS.strongSessionBonus);
    },
    [clearTimer, stop, defaultWpm]
  );

  const submit = (value: string) => {
    if (phase !== "playing" || !value.trim()) return;
    const typed = value.trim().toUpperCase();
    const correct = typed === currentWord;

    attemptsRef.current.total += 1;
    setFeedback(correct ? "correct" : "incorrect");
    setFeedbackWord(currentWord);

    if (correct) {
      attemptsRef.current.correct += 1;
      const nextCombo = combo + 1;
      bumpCombo();
      setBurstId((b) => b + 1);
      playCorrectSfx();
      if (nextCombo % 5 === 0) playComboSfx(Math.floor(nextCombo / 5));
      const bonus = windowRef.current > 5000 ? 5 : 0;
      scoreRef.current += 10 + bonus + Math.min(10, combo);
      setScore(scoreRef.current);
      setRound((r) => r + 1);
      windowRef.current = Math.max(MIN_WINDOW_MS, windowRef.current - 200);
      setTimeout(() => {
        if (aliveRef.current) nextWord(currentWord);
      }, 1200);
    } else {
      shake();
      playWrongSfx();
      resetCombo();
      if (timerRef.current) clearInterval(timerRef.current);
      stopped.current = true;
      void endGame(scoreRef.current);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && phase === "playing" && !stopped.current) {
      stopped.current = true;
      shake();
      playWrongSfx();
      resetCombo();
      void endGame(scoreRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, endGame]);

  const start = (diff: Difficulty) => {
    aliveRef.current = true;
    stopped.current = false;
    void markGamePlayed("decodeTranslate");
    setDifficulty(diff);
    scoreRef.current = 0;
    setScore(0);
    setRound(0);
    setIsNewHigh(false);
    resetComboAll();
    setBurstId(0);
    attemptsRef.current = { correct: 0, total: 0 };
    windowRef.current = START_WINDOW_MS;
    startedAt.current = Date.now();
    setPhase("playing");
    setTimeout(() => nextWord(), 200);
  };

  if (phase === "idle") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <Icon name="headphones" className="w-10 h-10 text-primary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("games.decodeTranslate.title")}
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-sm">
          {t("games.decodeTranslate.instructions")}
        </p>
        {highScore > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            {t("games.decodeTranslate.bestScore", { score: highScore })}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full max-w-xs">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <Button key={d} onClick={() => start(d)}>
              {t(`games.decodeTranslate.difficulty.${d}`)}
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

  const ringProgress = windowRef.current > 0 ? timeLeft / windowRef.current : 0;

  return (
    <Card
      className={cn(
        "p-lg flex flex-col items-center text-center gap-lg relative overflow-hidden",
        shaking && "animate-game-shake",
        feedback === "incorrect" && "animate-flash-error"
      )}
    >
      <div className="flex justify-between items-center w-full max-w-md text-sm">
        <span className="text-on-surface-variant">
          {t("games.decodeTranslate.round", { n: round + 1 })}
        </span>
        <ComboBadge combo={combo} />
        <span className="text-on-surface-variant">
          {t("games.score")}: <strong className="text-primary">{score}</strong>
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <RingTimer progress={ringProgress} size={72} strokeWidth={4} danger={ringProgress < 0.25} />
        <ParticleBurst burstId={burstId} color="var(--color-primary)" />
      </div>

      <div className="flex gap-md">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => play(morseSequence)}
          icon={<Icon name="play" className="w-4 h-4" />}
        >
          {t("games.decodeTranslate.replay")}
        </Button>
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => {
          const val = e.target.value.toUpperCase();
          setInput(val);
          if (val.length >= currentWord.length) {
            submit(val);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(input);
        }}
        autoComplete="off"
        autoCapitalize="characters"
        className={cn(
          "w-full max-w-xs h-14 text-center text-display-sm font-heading-md rounded-xl border-2 bg-surface transition-colors focus:outline-none focus:ring-0",
          feedback === "correct" && "border-primary text-primary",
          feedback === "incorrect" && "border-error text-error",
          feedback === "idle" && "border-outline-variant text-on-surface"
        )}
        placeholder={t("games.decodeTranslate.inputPlaceholder")}
      />

      {feedback !== "idle" && (
        <p className={cn("text-label-sm", feedback === "correct" ? "text-primary" : "text-error")}>
          {feedback === "correct"
            ? t("games.decodeTranslate.correctWord", { word: feedbackWord })
            : t("games.decodeTranslate.incorrectWord", { word: feedbackWord })}
        </p>
      )}
    </Card>
  );
}
