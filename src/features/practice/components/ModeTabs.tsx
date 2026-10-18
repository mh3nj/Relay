import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type PracticeMode =
  | "tree"
  | "hear"
  | "read"
  | "translate"
  | "flashcards"
  | "speed"
  | "endless"
  | "memory";

const MODES: { mode: PracticeMode; icon: IconName; labelKey: string }[] = [
  { mode: "tree", icon: "target", labelKey: "practice.modes.morseTree.title" },
  { mode: "hear", icon: "headphones", labelKey: "practice.modes.hearAndType" },
  { mode: "read", icon: "waveform", labelKey: "practice.modes.readAndType" },
  { mode: "translate", icon: "keyboard", labelKey: "practice.modes.translateDrill" },
  { mode: "flashcards", icon: "flashcards", labelKey: "practice.modes.flashcards" },
  { mode: "speed", icon: "speed", labelKey: "practice.modes.speed" },
  { mode: "endless", icon: "endless", labelKey: "practice.modes.endless" },
  { mode: "memory", icon: "brain", labelKey: "practice.modes.memory" },
];

interface ModeTabsProps {
  active: PracticeMode;
  onChange: (mode: PracticeMode) => void;
}

export function ModeTabs({ active, onChange }: ModeTabsProps) {
  const { t } = useTranslation();
  return (
    <div
      className="flex gap-sm bg-surface-container rounded-xl p-1 border border-outline-variant/30 w-fit overflow-x-auto"
      role="tablist"
    >
      {MODES.map(({ mode, icon, labelKey }) => {
        const label = t(labelKey);
        return (
          <button
            key={mode}
            role="tab"
            aria-selected={active === mode}
            aria-label={active === mode ? undefined : label}
            title={active === mode ? undefined : label}
            onClick={() => onChange(mode)}
            className={cn(
              "shrink-0 flex items-center justify-center gap-sm px-lg py-2.5 rounded-lg text-body-md font-medium transition-colors whitespace-nowrap",
              active === mode
                ? "bg-surface-container-high text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Icon name={icon} className="w-4 h-4" />
            {active === mode && label}
          </button>
        );
      })}
    </div>
  );
}
