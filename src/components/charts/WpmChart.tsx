import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { WpmDataPoint, WpmRange } from "@/features/dashboard/lib/wpmHistory";

interface WpmChartProps {
  datasets: Record<WpmRange, WpmDataPoint[]>;
}

const RANGES: { key: WpmRange; labelKey: string }[] = [
  { key: "week", labelKey: "common.rangeWeek" },
  { key: "month", labelKey: "common.rangeMonth" },
  { key: "all", labelKey: "common.rangeAll" },
];

export function WpmChart({ datasets }: WpmChartProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<WpmRange>("week");
  const data = datasets[range];
  const max = Math.max(...data.map((d) => d.wpm), 1);
  const yTicks = [...new Set([0, Math.round(max / 2), Math.ceil(max)])];
  const hasAnyData = useMemo(() => data.some((d) => d.wpm > 0), [data]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-lg">
        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          {t("dashboard.speedProgression")}
        </h3>
        <div className="flex gap-sm" role="group" aria-label={t("common.chartRange") ?? "Chart range"}>
          {RANGES.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              aria-pressed={range === key}
              className={cn(
                "font-label-sm text-label-sm px-2 py-1 rounded transition-colors",
                range === key
                  ? "bg-surface-bright text-on-surface"
                  : "text-on-surface-variant hover:bg-surface-bright"
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-end gap-2 md:gap-4 pb-sm relative border-b border-outline-variant/30 pt-xl">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[0.625rem] text-on-surface-variant pb-sm pointer-events-none">
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        {!hasAnyData ? (
          <div className="ml-8 w-full h-full flex items-center justify-center text-label-sm text-on-surface-variant">
            {t("dashboard.noSpeedDataYet")}
          </div>
        ) : (
          <div
            key={range}
            className="ml-8 w-full h-full flex items-end gap-1 sm:gap-2 md:gap-4 justify-between relative z-10"
          >
            {data.map((point, i) => {
              const heightPct = Math.max((point.wpm / max) * 100, point.wpm > 0 ? 4 : 0);
              const isLast = i === data.length - 1;
              return (
                <div
                  key={`${range}-${point.label}-${i}`}
                  className={cn(
                    "w-full rounded-t-sm transition-[height,background-color] duration-500 cursor-pointer group relative",
                    isLast && point.wpm > 0
                      ? "bg-primary hover:bg-primary-fixed shadow-[0_0_10px_rgba(192,193,255,0.3)]"
                      : "bg-primary/30 hover:bg-primary/50"
                  )}
                  style={{ height: `${heightPct}%`, transitionDelay: `${i * 25}ms` }}
                >
                  {point.wpm > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface text-on-surface font-label-sm text-[0.625rem] px-1 rounded opacity-0 group-hover:opacity-100 border border-outline-variant/50 pointer-events-none whitespace-nowrap">
                      {point.wpm}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasAnyData && (
        <div className="flex justify-between mt-xs ml-8 text-[0.625rem] text-on-surface-variant font-label-sm">
          {data.map((point, i) => (
            <span key={`${range}-label-${i}`}>{point.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
