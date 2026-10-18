import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { pickWeightedChar } from "@/lib/practiceEngine";
import { playCorrectSfx, playWrongSfx } from "@/lib/gameSfx";
import type { SymbolStat } from "@/types/learn";

interface ReadAndTypeProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean, actualChar?: string) => void;
}

type Feedback = "idle" | "correct" | "incorrect";

export function ReadAndType({ pool, stats, onAnswer }: ReadAndTypeProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(() => pickWeightedChar(pool, stats));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [current]);

  const submit = (value: string) => {
    if (!value) return;
    const typed = value.toUpperCase();
    const correct = typed === current;
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) playCorrectSfx();
    else playWrongSfx();
    onAnswer(current, correct, typed);

    setTimeout(
      () => {
        setFeedback("idle");
        setInput("");
        setCurrent((prev) => pickWeightedChar(pool, stats, prev));
      },
      correct ? 500 : 1100
    );
  };

  return (
    <Card className="p-lg flex flex-col items-stretch text-center gap-lg w-full">
      <p className="text-body-md text-on-surface-variant w-full">
        {t("practice.readAndType.instructions")}
      </p>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-xs h-32 bg-waveform-well rounded-xl border border-outline-variant/50 flex items-center justify-center">
          <span className="font-morse-code text-4xl text-primary tracking-[0.3em]">
            {CHAR_TO_MORSE[current]}
          </span>
        </div>
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
          placeholder={t("practice.readAndType.inputPlaceholderShort") ?? "Type"}
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
