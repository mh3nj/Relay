import { useRef, useState } from "react";
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
import type { SymbolStat } from "@/types/learn";

interface EndlessModeProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean, actualChar?: string) => void;
}

export function EndlessMode({ pool, stats, onAnswer }: EndlessModeProps) {
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
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastSummary, setLastSummary] = useState<{ correct: number; attempts: number } | null>(
    null
  );
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef(0);

  const start = () => {
    setCorrectCount(0);
    setAttemptCount(0);
    setLastSummary(null);
    startedAt.current = Date.now();
    setRunning(true);
    const first = pickWeightedChar(pool, stats);
    setCurrent(first);
    play(CHAR_TO_MORSE[first] ?? "");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const stop = () => {
    setRunning(false);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    if (attemptCount > 0) {
      const wpm = Math.round(correctCount / 5 / (elapsedSeconds / 60));
      const accuracy = Math.round((correctCount / attemptCount) * 100);
      void appendSessionLog({ date: new Date().toISOString(), wpm, accuracy, source: "speed" });
      void addPracticeSeconds(elapsedSeconds);
      setLastSummary({ correct: correctCount, attempts: attemptCount });
    }
  };

  const submit = (value: string) => {
    if (!running || !value) return;
    const typed = value.toUpperCase();
    const correct = typed === current;
    onAnswer(current, correct, typed);
    setAttemptCount((c) => c + 1);
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((c) => c + 1);
    setInput("");
    const nextChar = pickWeightedChar(pool, stats, current);
    setCurrent(nextChar);
    play(CHAR_TO_MORSE[nextChar] ?? "");
    setTimeout(() => setFeedback("idle"), 200);
  };

  if (!running) {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <Icon name="endless" className="w-10 h-10 text-primary" />
        <p className="text-body-md text-on-surface-variant max-w-sm">
          {t("practice.endless.instructions")}
        </p>
        {lastSummary && (
          <p className="text-label-sm text-on-surface-variant">
            {t("practice.endless.summary")}: {lastSummary.correct}/{lastSummary.attempts}
          </p>
        )}
        <Button onClick={start} icon={<Icon name="play" className="w-4 h-4" />}>
          {t("common.start")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-lg flex flex-col items-center text-center gap-lg">
      <div className="flex items-center gap-lg text-sm">
        <span className="text-on-surface-variant">
          {t("practice.session.correct")}:{" "}
          <strong className="text-primary">
            {correctCount}/{attemptCount}
          </strong>
        </span>
      </div>

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

      <Button variant="outline" onClick={stop} icon={<Icon name="stop" className="w-4 h-4" />}>
        {t("practice.endless.stop")}
      </Button>
    </Card>
  );
}
