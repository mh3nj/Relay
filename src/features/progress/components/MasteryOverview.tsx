import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface MasteryOverviewProps {
  percent: number;
  practiceHours: number;
  streakDays: number;
  className?: string;
  style?: CSSProperties;
}

export function MasteryOverview({
  percent,
  practiceHours,
  streakDays,
  className,
  style,
}: MasteryOverviewProps) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn("md:col-span-4 p-lg flex flex-col items-center justify-center", className)}
      style={style}
    >
      <h3 className="font-heading-md text-heading-md text-on-surface self-start w-full mb-xl">
        {t("progress.mastery")}
      </h3>
      <div className="mb-lg">
        <ProgressRing percent={percent} size={160} label={t("progress.masteryLabel", { percent })} />
      </div>
      <div className="flex justify-between w-full pt-md border-t border-outline-variant/30">
        <div className="text-center">
          <p className="text-label-sm text-on-surface-variant">{t("progress.practiceTime")}</p>
          <p className="font-heading-md text-heading-md text-on-surface">{practiceHours}h</p>
        </div>
        <div className="text-center">
          <p className="text-label-sm text-on-surface-variant">{t("progress.currentStreak")}</p>
          <p className="font-heading-md text-heading-md text-tertiary flex items-center gap-xs justify-center">
            <Icon name="flame" className="w-5 h-5" />
            {streakDays}
          </p>
        </div>
      </div>
    </Card>
  );
}
