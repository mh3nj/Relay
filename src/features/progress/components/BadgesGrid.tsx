import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { BadgeDef } from "@/lib/badges";

export function BadgesGrid({
  badges,
  className,
  style,
}: {
  badges: BadgeDef[];
  className?: string;
  style?: CSSProperties;
}) {
  const { t } = useTranslation();
  return (
    <Card className={cn("md:col-span-8 p-lg", className)} style={style}>
      <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
        {t("progress.badgesTitle")}
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-md">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-xs text-center">
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border",
                badge.earned
                  ? "bg-secondary-container/60 border-secondary/40"
                  : "bg-surface-bright border-outline-variant/30 opacity-40 grayscale"
              )}
              title={t(badge.labelKey) ?? undefined}
            >
              <Icon
                name={badge.icon}
                className={cn(
                  "w-6 h-6",
                  badge.earned ? "text-secondary" : "text-on-surface-variant"
                )}
              />
            </div>
            <span className="text-[0.625rem] text-on-surface-variant leading-tight">
              {t(badge.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
