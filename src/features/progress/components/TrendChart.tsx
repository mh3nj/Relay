import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import type { SessionLogEntry } from "@/lib/sessionLog";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  entries: SessionLogEntry[];
  className?: string;
  style?: CSSProperties;
}

interface Point {
  x: number;
  y: number;
  value: number;
}

function buildPoints(values: number[], max: number): Point[] {
  if (values.length === 0) return [];
  if (values.length === 1) {
    return [{ x: 0, y: 100 - (values[0] / max) * 100, value: values[0] }];
  }
  const step = 100 / (values.length - 1);
  return values.map((v, i) => ({ x: i * step, y: 100 - (v / max) * 100, value: v }));
}

function pathFromPoints(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

export function TrendChart({ entries, className, style }: TrendChartProps) {
  const { t } = useTranslation();
  const recent = entries.slice(-20);

  if (recent.length === 0) {
    return (
      <Card className={cn("md:col-span-8 p-lg flex flex-col", className)} style={style}>
        <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
          {t("progress.performanceTrends")}
        </h3>
        <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm min-h-[180px]">
          {t("progress.trendEmptyState")}
        </div>
      </Card>
    );
  }

  const wpmValues = recent.map((e) => e.wpm);
  const accValues = recent.map((e) => e.accuracy);
  const maxWpm = Math.max(...wpmValues, 10);
  const wpmPoints = buildPoints(wpmValues, maxWpm);
  const accPoints = buildPoints(accValues, 100);

  return (
    <Card className={cn("md:col-span-8 p-lg flex flex-col", className)} style={style}>
      <div className="flex justify-between items-center mb-lg">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("progress.performanceTrends")}
        </h3>
        <div className="flex gap-md text-label-sm">
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full bg-primary" /> {t("progress.wpmLabel")}
          </div>
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full bg-tertiary" /> {t("practice.speed.accuracy")}
          </div>
        </div>
      </div>

      <div className="flex-grow relative h-48 w-full border-l border-b border-outline-variant/40 pl-sm pb-sm">
        <div className="absolute -left-8 top-0 text-[0.625rem] text-on-surface-variant">
          {Math.ceil(maxWpm)}
        </div>
        <div className="absolute -left-8 bottom-0 text-[0.625rem] text-on-surface-variant">0</div>

        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line
            x1="0"
            x2="100"
            y1="50"
            y2="50"
            stroke="currentColor"
            className="text-outline-variant/40"
            strokeDasharray="2,2"
            strokeWidth="0.5"
          />
          <path
            d={pathFromPoints(wpmPoints)}
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={pathFromPoints(accPoints)}
            fill="none"
            stroke="currentColor"
            className="text-tertiary"
            strokeWidth="2"
            strokeDasharray="4,4"
            vectorEffect="non-scaling-stroke"
          />
          {wpmPoints.map((p, i) => (
            <circle
              key={`wpm-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              vectorEffect="non-scaling-stroke"
              className="fill-primary/0 hover:fill-primary stroke-primary/0 transition-colors cursor-pointer"
            >
              <title>
                {new Date(recent[i].date).toLocaleDateString()}: {p.value} {t("progress.wpmLabel")}
              </title>
            </circle>
          ))}
          {accPoints.map((p, i) => (
            <circle
              key={`acc-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              vectorEffect="non-scaling-stroke"
              className="fill-tertiary/0 hover:fill-tertiary transition-colors cursor-pointer"
            >
              <title>
                {new Date(recent[i].date).toLocaleDateString()}: {p.value}% {t("practice.speed.accuracy")}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="flex justify-between w-full mt-xs text-[0.625rem] text-on-surface-variant pl-md">
        <span>{new Date(recent[0].date).toLocaleDateString()}</span>
        <span>{new Date(recent[recent.length - 1].date).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}
