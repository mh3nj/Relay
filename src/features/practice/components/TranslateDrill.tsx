import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { pickWeightedChar } from "@/lib/practiceEngine";
import { playCorrectSfx, playWrongSfx } from "@/lib/gameSfx";
import type { SymbolStat } from "@/types/learn";

interface TranslateDrillProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean) => void;
}

export function TranslateDrill({ pool, stats, onAnswer }: TranslateDrillProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(() => pickWeightedChar(pool, stats));
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");

  const target = CHAR_TO_MORSE[current] ?? "";

  useEffect(() => {
    setTyped("");
    setFeedback("idle");
  }, [current]);

  const handleSymbol = (symbol: "." | "-") => {
    if (feedback !== "idle") return;
    const attempt = typed + symbol;

    if (!target.startsWith(attempt)) {
      setFeedback("incorrect");
      playWrongSfx();
      onAnswer(current, false);
      setTimeout(() => setCurrent((prev) => pickWeightedChar(pool, stats, prev)), 1000);
      return;
    }

    if (attempt === target) {
      setTyped(attempt);
      setFeedback("correct");
      playCorrectSfx();
      onAnswer(current, true);
      setTimeout(() => setCurrent((prev) => pickWeightedChar(pool, stats, prev)), 500);
    } else {
      setTyped(attempt);
    }
  };

  useEffect(() => {
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
  }, [typed, current, feedback]);

  return (
    <Card className="p-lg flex flex-col items-center text-center gap-lg">
      <p className="text-body-md text-on-surface-variant">
        {t("practice.translateDrill.instructions")}
      </p>

      <div className="flex flex-col items-center gap-md">
        <span className="font-display-lg text-display-lg text-on-surface">{current}</span>
        <div className="flex gap-sm">
          {target.split("").map((symbol, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full border transition-colors",
                symbol === "-" ? "w-10 h-3" : "w-4 h-3",
                i < typed.length
                  ? feedback === "incorrect"
                    ? "bg-error border-error"
                    : "bg-primary border-primary shadow-[0_0_10px_rgba(192,193,255,0.8)]"
                  : "bg-surface-container-high border-outline-variant"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-md">
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
      <p className="text-label-sm text-on-surface-variant">
        {t("practice.translateDrill.spaceToKey")}
      </p>
    </Card>
  );
}
