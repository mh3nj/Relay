import { cn } from "@/lib/utils";

interface GameStatProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

/** One stat tile (value + label) for a game's end screen. */
export function GameStat({ label, value, highlight }: GameStatProps) {
  return (
    <div>
      <p
        className={cn(
          "font-display-lg text-display-lg",
          highlight ? "text-primary" : "text-on-surface"
        )}
      >
        {value}
      </p>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</p>
    </div>
  );
}
