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
import { kvGet, kvSet } from "@/lib/db";
import { playCorrectSfx, playWrongSfx, playHighScoreSfx } from "@/lib/gameSfx";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";
import type { SymbolStat } from "@/types/learn";

interface MemoryModeProps {
  pool: string[];
  stats: Record<string, SymbolStat>;
  onAnswer: (char: string, correct: boolean) => void;
}

type Phase = "idle" | "watching" | "recalling" | "failed";

const BEST_LENGTH_KEY = "memoryModeBestLength";

export function MemoryMode({ pool, stats, onAnswer }: MemoryModeProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<string[]>([]);
  const [recallIndex, setRecallIndex] = useState(0);
  const [watchIndex, setWatchIndex] = useState(-1);
  const [bestLength, setBestLength] = useState(0);
  const [lastFailedLength, setLastFailedLength] = useState(0);
  const [justBeatBest, setJustBeatBest] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const watchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void kvGet<number>(BEST_LENGTH_KEY).then((stored) => setBestLength(stored ?? 0));
  }, []);

  const playWatchStep = useCallback(
    (seq: string[], index: number) => {
      if (index >= seq.length) {
        setPhase("recalling");
        setRecallIndex(0);
        return;
      }
      setWatchIndex(index);
      play(CHAR_TO_MORSE[seq[index]] ?? "");
      watchTimer.current = setTimeout(() => playWatchStep(seq, index + 1), 900);
    },
    [play]
  );

  const startRound = (seq: string[]) => {
    setSequence(seq);
    setPhase("watching");
    setWatchIndex(-1);
    if (watchTimer.current) clearTimeout(watchTimer.current);
    watchTimer.current = setTimeout(() => playWatchStep(seq, 0), 500);
  };

  const start = () => {
    setJustBeatBest(false);
    const first = pickWeightedChar(pool, stats);
    startRound([first]);
  };

  const submitRecall = (char: string) => {
    const expected = sequence[recallIndex];
    const correct = char === expected;
    onAnswer(expected, correct);

    if (!correct) {
      playWrongSfx();
      setPhase("failed");
      setLastFailedLength(sequence.length);
      if (sequence.length > bestLength) {
        setBestLength(sequence.length);
        void kvSet(BEST_LENGTH_KEY, sequence.length);
      }
      return;
    }

    if (recallIndex + 1 === sequence.length) {
      // Full sequence reproduced. Grow it by one and watch again.
      setBurstId((b) => b + 1);
      if (sequence.length >= bestLength && sequence.length > 0) {
        setJustBeatBest(true);
        playHighScoreSfx();
      } else {
        playCorrectSfx();
      }
      const next = pickWeightedChar(pool, stats, sequence[sequence.length - 1]);
      setTimeout(() => startRound([...sequence, next]), 400);
    } else {
      playCorrectSfx();
      setRecallIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    return () => {
      if (watchTimer.current) clearTimeout(watchTimer.current);
    };
  }, []);

  if (phase === "idle" || phase === "failed") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <Icon name="brain" className="w-10 h-10 text-primary" />
        <p className="text-body-md text-on-surface-variant max-w-sm">
          {t("practice.memory.instructions")}
        </p>
        {phase === "failed" && (
          <p className="text-error text-sm">
            {t("practice.memory.roundFailed", { length: lastFailedLength - 1 })}
          </p>
        )}
        {bestLength > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            {t("practice.memory.bestLength", { length: bestLength })}
          </p>
        )}
        <Button onClick={start} icon={<Icon name="play" className="w-4 h-4" />}>
          {t("practice.memory.startRound")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-lg flex flex-col items-center text-center gap-lg">
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
        {t("practice.memory.sequenceLength", { length: sequence.length })}
      </p>

      {phase === "watching" ? (
        <>
          <p className="text-body-md text-on-surface-variant">
            {t("practice.memory.watchPrompt")}
          </p>
          <div className="flex gap-sm flex-wrap justify-center max-w-xs">
            {sequence.map((char, i) => (
              <div
                key={i}
                className={cn(
                  "w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-lg transition-colors",
                  i === watchIndex
                    ? "bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(192,193,255,0.6)]"
                    : "bg-surface-container-high border-outline-variant text-on-surface-variant"
                )}
              >
                {i <= watchIndex ? char : "•"}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-body-md text-on-surface-variant">{t("practice.memory.yourTurn")}</p>
          <div className="relative flex gap-sm flex-wrap justify-center max-w-xs mb-md">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full",
                  i < recallIndex ? "bg-primary" : "bg-surface-container-high"
                )}
              />
            ))}
            <ParticleBurst burstId={burstId} color="var(--color-primary)" />
          </div>
          {justBeatBest && sequence.length > 1 && (
            <p className="text-tertiary text-sm font-semibold flex items-center gap-xs animate-combo-pop">
              <Icon name="crown" className="w-4 h-4" /> {t("games.newHighScore")}
            </p>
          )}
          <div className="grid grid-cols-6 gap-2 max-w-sm">
            {[...new Set(pool)].map((char) => (
              <button
                key={char}
                onClick={() => submitRecall(char)}
                className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface font-bold hover:bg-primary/10 hover:border-primary transition-colors"
              >
                {char}
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
