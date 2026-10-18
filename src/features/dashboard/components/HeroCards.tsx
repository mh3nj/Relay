import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { XpProgress } from "@/lib/xp";

interface WelcomeHeroProps {
  streakDays: number;
  currentChar: string;
  currentCode: string;
  xpProgress: XpProgress;
  className?: string;
  style?: CSSProperties;
}

function greetingKey(hour: number): string {
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export function WelcomeHero({
  streakDays,
  currentChar,
  currentCode,
  xpProgress,
  className,
  style,
}: WelcomeHeroProps) {
  const { t } = useTranslation();
  const greeting = t(greetingKey(new Date().getHours()));

  return (
    <Card
      className={cn("md:col-span-12 lg:col-span-8 overflow-hidden relative group", className)}
      style={style}
    >
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors duration-500" />
      <div className="p-lg md:p-xl relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-lg h-full">
        <div className="flex-1">
          <div className="flex items-center gap-md mb-md flex-wrap">
            <div className="flex items-center gap-sm">
              <Icon
                name="flame"
                className={cn("w-5 h-5 text-tertiary", streakDays > 0 && "animate-gentle-pulse")}
              />
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">
                {t("dashboard.streakDays", { count: streakDays })}
              </span>
            </div>
            <div className="flex items-center gap-sm px-sm py-1 rounded-full bg-primary/10 border border-primary/30">
              <Icon name="star" className="w-3.5 h-3.5 text-primary" />
              <span className="font-label-sm text-label-sm text-primary">
                {t("progress.level", { level: xpProgress.level })}
              </span>
            </div>
          </div>
          <h3 className="font-heading-md text-heading-md text-on-surface mb-sm">{greeting}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-xl max-w-md">
            {t("dashboard.continuePrompt", { char: currentChar })}
          </p>
          <Link to="/learn">
            <Button variant="secondary" icon={undefined}>
              {t("dashboard.continueLesson", { char: currentChar })}
              <Icon name="arrowRight" className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="shrink-0 w-32 h-32 md:w-40 md:h-40 bg-waveform-well rounded-xl border border-outline-variant/50 flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          <span className="font-display-lg text-display-lg text-on-background leading-none mb-xs">
            {currentChar}
          </span>
          <span className="font-morse-code text-morse-code text-primary leading-none">
            {currentCode}
          </span>
        </div>
      </div>
    </Card>
  );
}

interface DailyChallengeCardProps {
  target: number;
  done: number;
  total: number;
  className?: string;
  style?: CSSProperties;
}

export function DailyChallengeCard({ target, done, total, className, style }: DailyChallengeCardProps) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0;
  const isComplete = done >= total;
  return (
    <Card className={cn("md:col-span-12 lg:col-span-4 p-lg flex flex-col", className)} style={style}>
      <div className="flex items-center justify-between mb-md">
        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          {t("dashboard.dailyChallenge")}
        </h3>
        {isComplete && (
          <Icon name="checkCircle" className="w-4 h-4 text-primary animate-combo-pop" />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <p className="font-heading-md text-heading-md text-on-surface mb-sm">
          {isComplete ? t("dashboard.challengeComplete") : t("dashboard.dailyChallengeGoal", { target })}
        </p>
        <div className="flex items-center gap-md mb-xs">
          <div
            className="flex-1 h-2 bg-surface-bright rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isComplete ? "bg-tertiary" : "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-label-sm text-label-sm text-on-surface">
            {done}/{total}
          </span>
        </div>
      </div>
      {isComplete ? (
        <Link to="/games">
          <Button variant="outline" className="mt-md w-full" icon={<Icon name="games" className="w-4 h-4" />}>
            {t("dashboard.playAGame")}
          </Button>
        </Link>
      ) : (
        <Link to="/practice">
          <Button variant="outline" className="mt-md w-full">
            {t("dashboard.startChallenge")}
          </Button>
        </Link>
      )}
    </Card>
  );
}
