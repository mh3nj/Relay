import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { WeakSymbol } from "@/types/progress";
import type { BadgeDef } from "@/lib/badges";

export function MasteryCard({ percent, className, style }: { percent: number; className?: string; style?: CSSProperties }) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn("md:col-span-6 lg:col-span-4 p-lg flex flex-col items-center hover:bg-surface-container-high transition-colors", className)}
      style={style}
    >
      <CardEyebrow className="self-start">{t("dashboard.overallMastery")}</CardEyebrow>
      <div className="flex-1 flex items-center justify-center py-md">
        <ProgressRing percent={percent} />
      </div>
    </Card>
  );
}

export function WeakSymbolsCard({
  symbols,
  className,
  style,
}: {
  symbols: WeakSymbol[];
  className?: string;
  style?: CSSProperties;
}) {
  const { t } = useTranslation();
  // Deep-links into Practice's focused-filter mode so "review" actually
  // drills the symbols shown here instead of the full learned pool.
  const focusHref =
    symbols.length > 0 ? `/practice?chars=${symbols.map((s) => s.char).join(",")}` : "/practice";

  return (
    <Card className={cn("md:col-span-6 lg:col-span-4 p-lg flex flex-col", className)} style={style}>
      <div className="flex items-center justify-between mb-lg">
        <CardEyebrow>{t("dashboard.needsReview")}</CardEyebrow>
        <Icon name="alertCircle" className="w-4 h-4 text-error" />
      </div>
      <div className="flex gap-md flex-1 items-center justify-center">
        {symbols.map((s) => (
          <div
            key={s.char}
            title={t("dashboard.accuracyTooltip", { accuracy: s.accuracy })}
            className="w-16 h-16 bg-waveform-well rounded-lg border border-error/30 flex flex-col items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:border-error transition-colors cursor-pointer"
          >
            <span className="text-body-md text-on-background font-bold leading-none mb-1">
              {s.char}
            </span>
            <span className="font-morse-code text-label-sm text-error leading-none tracking-[0.1em]">
              {s.code}
            </span>
          </div>
        ))}
        <Link
          to={focusHref}
          className="w-16 h-16 rounded-lg border border-dashed border-outline-variant flex items-center justify-center hover:bg-surface-bright transition-colors"
          aria-label={t("common.reviewWeakSymbols") ?? "Review all weak symbols"}
        >
          <Icon name="arrowRight" className="w-5 h-5 text-on-surface-variant" />
        </Link>
      </div>
    </Card>
  );
}

export function BadgesCard({
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
    <Card className={cn("md:col-span-12 lg:col-span-4 p-lg flex flex-col", className)} style={style}>
      <div className="flex items-center justify-between mb-lg">
        <CardEyebrow>{t("dashboard.recentBadges")}</CardEyebrow>
        <Icon name="trophy" className="w-4 h-4 text-on-surface-variant" />
      </div>
      <div className="flex gap-md flex-wrap items-center">
        {badges.map((badge) => (
          <div key={badge.id} className="relative group cursor-help">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant/30",
                badge.earned ? "bg-secondary-container" : "bg-surface-bright opacity-50 grayscale"
              )}
            >
              <Icon
                name={badge.icon}
                className={cn("w-5 h-5", badge.earned ? "text-secondary" : "text-on-surface-variant")}
              />
            </div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm px-sm py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
              {badge.earned ? t(badge.labelKey) : t("dashboard.locked", { label: t(badge.labelKey) })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
