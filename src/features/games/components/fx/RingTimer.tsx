import { cn } from "@/lib/utils";

interface RingTimerProps {
  /** 0-1, where 1 = full time remaining and 0 = out of time. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Switches the stroke to the error color for a last-seconds warning. */
  danger?: boolean;
}

/** Circular countdown ring. Reuses the app's existing `.progress-ring-circle`
 * utility (rotate -90deg so the stroke starts at 12 o'clock) so it matches
 * the visual language already used on the Progress screen. */
export function RingTimer({ progress, size = 96, strokeWidth = 6, className, danger }: RingTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <svg width={size} height={size} className={cn("shrink-0", className)} role="presentation">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-outline-variant)"
        strokeWidth={strokeWidth}
        opacity={0.4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={danger ? "var(--color-error)" : "var(--color-primary)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
        style={{ transition: "stroke-dashoffset 80ms linear, stroke 200ms ease" }}
      />
    </svg>
  );
}
