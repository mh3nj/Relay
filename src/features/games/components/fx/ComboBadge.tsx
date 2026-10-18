import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface ComboBadgeProps {
  combo: number;
  className?: string;
}

/** Flame badge that appears once a streak is actually worth celebrating,
 * and re-pops on every increment via the `key` remount trick. */
export function ComboBadge({ combo, className }: ComboBadgeProps) {
  if (combo < 2) return null;
  return (
    <div
      key={combo}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-tertiary-container/80 text-on-tertiary-container",
        "px-sm py-1 text-label-sm font-semibold animate-combo-pop",
        className
      )}
    >
      <Icon name="flame" className="w-3.5 h-3.5" />
      {combo}×
    </div>
  );
}
