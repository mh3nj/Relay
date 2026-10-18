import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { prefersReducedMotion } from "@/lib/reducedMotion";

interface ProgressRingProps {
  /** 0 to 100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressRing({ percent, size = 128, strokeWidth = 8, label }: ProgressRingProps) {
  const { t } = useTranslation();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const reducedMotionRef = useRef(prefersReducedMotion());

  useEffect(() => {
    const target = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;
    if (reducedMotionRef.current) {
      setOffset(target);
      return;
    }
    const t = setTimeout(() => setOffset(target), 100);
    return () => clearTimeout(t);
  }, [percent, circumference]);

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? t("common.percent", { percent: Math.round(percent) })}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-surface-bright stroke-current"
          cx="50"
          cy="50"
          r={40}
          fill="transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          className="text-primary stroke-current progress-ring-circle"
          cx="50"
          cy="50"
          r={40}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={251.2}
          strokeDashoffset={offset * (251.2 / circumference)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="font-heading-md text-heading-md text-on-surface leading-none">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}
