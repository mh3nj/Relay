import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { getMnemonic } from "@/lib/mnemonics";
import { pickWeightedChar } from "@/lib/practiceEngine";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";
import type { SymbolStat } from "@/types/learn";

interface FlashcardsProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean) => void;
}

export function Flashcards({ pool, stats, onAnswer }: FlashcardsProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const [current, setCurrent] = useState(() => pickWeightedChar(pool, stats));
  const [revealed, setRevealed] = useState(false);

  const code = CHAR_TO_MORSE[current] ?? "";
  const mnemonic = getMnemonic(current);

  const flip = () => {
    if (!revealed) play(code);
    setRevealed((r) => !r);
  };

  const next = (correct: boolean) => {
    onAnswer(current, correct);
    setRevealed(false);
    setCurrent((prev) => pickWeightedChar(pool, stats, prev));
  };

  return (
    <Card className="p-lg flex flex-col items-center text-center gap-lg">
      <p className="text-body-md text-on-surface-variant">{t("practice.flashcards.instructions")}</p>

      <div className="w-full max-w-xs aspect-[4/3] flip-card">
        <button
          onClick={flip}
          className={cn("flip-card-inner w-full h-full", revealed && "is-flipped")}
          aria-label={revealed ? current : "?"}
        >
          <div className="flip-card-face bg-surface border border-outline-variant/50 rounded-xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)] hover:border-primary transition-colors">
            <span className="font-morse-code text-morse-code text-primary tracking-[0.3em]">
              {code}
            </span>
          </div>
          <div className="flip-card-face flip-card-back bg-surface border border-primary/50 rounded-xl flex-col gap-md">
            <span className="font-display-lg text-display-lg text-on-surface">{current}</span>
            {mnemonic.examples[0] && (
              <span className="text-label-sm text-on-surface-variant">{mnemonic.examples[0]}</span>
            )}
          </div>
        </button>
      </div>

      <Button variant="ghost" size="sm" onClick={flip} icon={<Icon name="eye" className="w-4 h-4" />}>
        {t("practice.flashcards.showAnswer")}
      </Button>

      {revealed && (
        <div className="flex gap-md">
          <Button
            variant="outline"
            onClick={() => next(false)}
            icon={<Icon name="close" className="w-4 h-4" />}
          >
            {t("practice.flashcards.didNotKnow")}
          </Button>
          <Button
            variant="primary"
            onClick={() => next(true)}
            icon={<Icon name="check" className="w-4 h-4" />}
          >
            {t("practice.flashcards.iKnewIt")}
          </Button>
        </div>
      )}
    </Card>
  );
}
