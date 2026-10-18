import { useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE, KOCH_ORDER } from "@/lib/morse";
import { accuracyFor, tierFor } from "@/lib/mastery";
import type { SymbolStat } from "@/types/learn";

interface CharacterMasteryGridProps {
  symbolStats: Record<string, SymbolStat>;
  lessonIndex: number;
  className?: string;
  style?: CSSProperties;
}

const TIER_CLASSES: Record<string, string> = {
  mastered: "bg-primary/20 border-primary/50 text-primary hover:bg-primary hover:text-on-primary",
  confident: "bg-secondary-container/40 border-secondary/40 text-secondary hover:bg-secondary/60",
  learning: "bg-error/10 border-error/30 text-error hover:bg-error hover:text-on-error",
  notStarted:
    "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant/40",
};

export function CharacterMasteryGrid({
  symbolStats,
  lessonIndex,
  className,
  style,
}: CharacterMasteryGridProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<string | null>(null);
  const reached = new Set(KOCH_ORDER.slice(0, Math.max(lessonIndex + 1, 1)));

  const displayOrder = [...KOCH_ORDER].sort();

  return (
    <Card className={cn("md:col-span-12 p-lg", className)} style={style}>
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("progress.characterMastery")}
        </h3>
        <div className="flex gap-sm text-[0.625rem]">
          <span className="px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
            {t("progress.mastered")}
          </span>
          <span className="px-2 py-1 rounded bg-surface-bright text-on-surface-variant">
            {t("progress.learning")}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-sm">
        {displayOrder.map((char) => {
          const stat = symbolStats[char];
          const isReached = reached.has(char);
          const tier = isReached ? tierFor(stat) : "notStarted";
          const acc = Math.round(accuracyFor(stat) * 100);

          return (
            <div
              key={char}
              onMouseEnter={() => setHovered(char)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "aspect-square border rounded-md flex items-center justify-center font-morse-code text-body-md transition-colors cursor-default relative",
                TIER_CLASSES[tier]
              )}
            >
              {char}
              {hovered === char && isReached && (
                <div className="absolute bottom-full mb-2 bg-surface-container-highest border border-outline-variant/50 p-sm rounded shadow-lg text-[0.625rem] w-max z-10 pointer-events-none">
                  <p className="font-bold text-on-surface">
                    {char} ({CHAR_TO_MORSE[char]})
                  </p>
                  <p className="text-on-surface-variant">
                    {stat
                      ? t("progress.accuracyLabel", { percent: acc, attempts: stat.attempts })
                      : t("progress.notPracticedYet")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
