import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { pickWeightedChar } from "@/lib/practiceEngine";
import { playCorrectSfx, playWrongSfx } from "@/lib/gameSfx";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";
import type { SymbolStat } from "@/types/learn";

interface HearAndTypeProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean, actualChar?: string) => void;
}

type Feedback = "idle" | "correct" | "incorrect";

export function HearAndType({ pool, stats, onAnswer }: HearAndTypeProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const [current, setCurrent] = useState(() => pickWeightedChar(pool, stats));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const playCurrent = () => play(CHAR_TO_MORSE[current] ?? "");

  useEffect(() => {
    playCurrent();
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const submit = (value: string) => {
    if (!value) return;
    const correct = value.toUpperCase() === current;
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) playCorrectSfx();
    else playWrongSfx();
    onAnswer(current, correct, value.toUpperCase());

    setTimeout(() => {
      setFeedback("idle");
      setInput("");
      setCurrent((prev) => pickWeightedChar(pool, stats, prev));
    }, correct ? 500 : 1100);
  };

  return (
    <Card className="p-lg flex flex-col items-stretch text-center gap-lg w-full">
      <p className="text-body-md text-on-surface-variant w-full">{t("practice.hearAndType.instructions")}</p>

      <div className="flex flex-col items-center gap-sm">
        <button
          onClick={playCurrent}
          aria-label={t("common.play")}
          className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-[0_4px_14px_rgba(192,193,255,0.3)]"
        >
          <Icon name="headphones" className="w-8 h-8" />
        </button>

        <Button variant="ghost" size="sm" onClick={playCurrent} icon={<Icon name="refresh" className="w-4 h-4" />}>
          {t("practice.hearAndType.replay")}
        </Button>
      </div>

      <div className="flex justify-center w-full">
        <input
          ref={inputRef}
          value={input}
          maxLength={1}
          onChange={(e) => {
            const value = e.target.value.slice(-1);
            setInput(value);
            if (value) submit(value);
          }}
          placeholder={t("practice.hearAndType.inputPlaceholderShort") ?? "Type"}
          disabled={feedback !== "idle"}
          autoComplete="off"
          autoCapitalize="characters"
          className={cn(
            "w-full max-w-[200px] h-24 text-center text-display-lg font-heading-md rounded-xl border-2 bg-surface transition-colors focus:outline-none focus:ring-0",
            feedback === "correct" && "border-primary text-primary",
            feedback === "incorrect" && "border-error text-error",
            feedback === "idle" && "border-outline-variant text-on-surface"
          )}
        />
      </div>

      <div className="h-6" aria-live="polite">
        {feedback === "correct" && (
          <p className="text-primary text-sm font-medium">{t("practice.hearAndType.correct")}</p>
        )}
        {feedback === "incorrect" && (
          <p className="text-error text-sm font-medium">
            {t("practice.hearAndType.incorrect", { answer: current })}
          </p>
        )}
      </div>
    </Card>
  );
}
