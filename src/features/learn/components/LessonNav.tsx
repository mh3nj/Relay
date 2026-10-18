import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { SymbolStat } from "@/types/learn";

interface LessonNavProps {
  hasPrevious: boolean;
  hasNext: boolean;
  isLastLesson: boolean;
  readyToAdvance: boolean;
  currentCharStat: SymbolStat | undefined;
  minAttemptsToAdvance: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function LessonNav({
  hasPrevious,
  hasNext,
  isLastLesson,
  readyToAdvance,
  currentCharStat,
  minAttemptsToAdvance,
  onPrevious,
  onNext,
}: LessonNavProps) {
  const { t } = useTranslation();
  const correct = currentCharStat?.correct ?? 0;

  return (
    <div className="mt-auto pt-lg border-t border-outline-variant/30 flex flex-col gap-sm">
      {!isLastLesson && (
        <p
          className={cn(
            "text-center text-label-sm",
            readyToAdvance ? "text-primary font-medium animate-combo-pop" : "text-on-surface-variant"
          )}
        >
          {readyToAdvance ? (
            <span className="inline-flex items-center gap-xs">
              <Icon name="checkCircle" className="w-3.5 h-3.5" />
              {t("learn.masteryGate.readyHint")}
            </span>
          ) : (
            t("learn.masteryGate.progress", {
              correct: Math.min(correct, minAttemptsToAdvance),
              needed: minAttemptsToAdvance,
            })
          )}
        </p>
      )}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious}
          icon={<Icon name="arrowLeft" className="w-4 h-4" />}
        >
          {t("common.previous")}
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!hasNext}
          className={cn("flex-row-reverse", readyToAdvance && hasNext && "animate-gentle-pulse")}
          icon={<Icon name="arrowRight" className="w-4 h-4" />}
        >
          {t("learn.nextCharacter")}
        </Button>
      </div>
    </div>
  );
}
