import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { SessionStats } from "@/hooks/useSessionStats";

interface SessionStatsBarProps {
  stats: SessionStats;
  accuracy: number;
}

export function SessionStatsBar({ stats, accuracy }: SessionStatsBarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-lg text-sm flex-wrap">
      <div>
        <span className="text-on-surface-variant">{t("practice.session.correct")}: </span>
        <span className="text-on-surface font-semibold">
          {stats.correct}/{stats.attempts}
        </span>
      </div>
      <div>
        <span className="text-on-surface-variant">{t("practice.speed.accuracy")}: </span>
        <span className="text-on-surface font-semibold">{accuracy}%</span>
      </div>
      <div className="flex items-center gap-xs">
        <span className="text-on-surface-variant">{t("practice.speed.streak")}: </span>
        <span
          key={stats.streak}
          className={cn(
            "font-semibold inline-flex items-center gap-1",
            stats.streak >= 2 ? "text-tertiary animate-combo-pop" : "text-primary"
          )}
        >
          {stats.streak >= 2 && <Icon name="flame" className="w-3.5 h-3.5" />}
          {stats.streak}
        </span>
      </div>
      {stats.bestStreak > 0 && (
        <div>
          <span className="text-on-surface-variant">{t("practice.session.bestStreak")}: </span>
          <span className="text-on-surface font-semibold">{stats.bestStreak}</span>
        </div>
      )}
    </div>
  );
}
