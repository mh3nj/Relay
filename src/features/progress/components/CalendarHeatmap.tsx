import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { SessionLogEntry } from "@/lib/sessionLog";

interface CalendarHeatmapProps {
  /** "YYYY-MM-DD" keys of days with real recorded activity (Learn
   * attempts included, broader than sessionLog, which only covers
   * completed timed/scored sessions). This is the source of truth for
   * whether a day counts as active at all. */
  activeDays: string[];
  streakDays?: number;
  /** Optional: completed-session log, used only to add a second
   * shading tier (more sessions that day = darker) on top of the
   * activeDays signal above. A day never gets downgraded to "empty"
   * just because it has no session-log entries. A Learn-only
   * day is still active even with 0 scored sessions. */
  sessionLog?: SessionLogEntry[];
  className?: string;
  style?: CSSProperties;
}

const DAY_KEYS = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarHeatmap({
  activeDays,
  streakDays = 0,
  sessionLog = [],
  className,
  style,
}: CalendarHeatmapProps) {
  const { t } = useTranslation();
  const activeSet = new Set(activeDays);

  const sessionCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of sessionLog) {
      const key = dateKey(new Date(entry.date));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [sessionLog]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const todayKey = dateKey(now);

  const activeThisMonth = activeDays.filter((k) => k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`));

  const prev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <Card className={cn("md:col-span-12 p-lg", className)} style={style}>
      <div className="flex items-center justify-between mb-md">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("progress.activityHeatmap")}
        </h3>
        <div className="flex items-center gap-xs text-label-sm text-on-surface-variant">
          <span>{t("progress.currentStreak")}: <strong className="text-primary">{streakDays}</strong></span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-md">
        <button onClick={prev} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant" aria-label={t("common.previous")}>
          <Icon name="arrowLeft" className="w-5 h-5" />
        </button>
        <span className="font-label-lg text-label-lg text-on-surface font-semibold">{monthLabel}</span>
        <button onClick={next} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant" aria-label={t("common.next")}>
          <Icon name="arrowRight" className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_KEYS.map((k) => (
          <div key={k} className="text-center text-[0.625rem] text-on-surface-variant font-label-sm py-1">
            {t(`common.${k}`)}
          </div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const d = new Date(viewYear, viewMonth, day);
          const key = dateKey(d);
          const isToday = key === todayKey;
          const isActive = activeSet.has(key);
          const sessionCount = sessionCountByDay.get(key) ?? 0;
          const isHeavy = isActive && sessionCount >= 2;

          return (
            <div
              key={key}
              title={d.toLocaleDateString()}
              className={cn(
                "aspect-square rounded flex items-center justify-center text-xs cursor-default transition-colors",
                isToday && "ring-1 ring-primary ring-offset-1 ring-offset-surface",
                isHeavy
                  ? "bg-primary text-on-primary font-semibold"
                  : isActive
                    ? "bg-primary/40 text-on-surface font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-md pt-sm border-t border-outline-variant/30 text-label-sm text-on-surface-variant">
        <span>{t("progress.activeDaysThisMonth", { count: activeThisMonth.length })}</span>
        <div className="flex items-center gap-2">
          <span>{t("common.less")}</span>
          <div className="flex gap-[2px]">
            <div className="w-3 h-3 rounded-sm bg-surface-container-high" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>{t("common.more")}</span>
        </div>
      </div>
    </Card>
  );
}
