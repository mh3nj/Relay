import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { XpProgress } from "@/lib/xp";

interface XpLevelCardProps {
  progress: XpProgress;
  className?: string;
  style?: CSSProperties;
}

export function XpLevelCard({ progress, className, style }: XpLevelCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn("md:col-span-4 p-lg flex flex-col justify-center gap-md", className)}
      style={style}
    >
      <div className="flex items-center gap-md">
        <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
          <Icon name="star" className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-heading-md text-heading-md text-on-surface leading-none">
            {t("progress.level", { level: progress.level })}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-xs">
            {t("progress.xpProgress", {
              current: progress.xpIntoLevel,
              total: progress.xpForNextLevel,
            })}
          </p>
        </div>
      </div>
      <div
        className="h-2 bg-surface-bright rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progress.percentToNextLevel}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${progress.percentToNextLevel}%` }}
        />
      </div>
    </Card>
  );
}
