import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { MorseSymbol } from "@/lib/morse";
import { NATO_PHONETIC } from "@/lib/encyclopediaData";
import { getMnemonic } from "@/lib/mnemonics";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";

interface CharacterGridProps {
  symbols: MorseSymbol[];
}

export function CharacterGrid({ symbols }: CharacterGridProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (symbols.length === 0) {
    return (
      <p className="text-on-surface-variant text-sm py-2xl text-center">
        {t("encyclopedia.noResults")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-md">
      {symbols.map((symbol) => {
        const isOpen = expanded === symbol.char;
        const mnemonic = getMnemonic(symbol.char);
        const phonetic = NATO_PHONETIC[symbol.char];

        return (
          <div
            key={symbol.char}
            className={cn(
              "bg-surface-container border rounded-xl p-md flex flex-col gap-sm transition-colors cursor-pointer",
              isOpen ? "border-primary" : "border-outline-variant/30 hover:border-primary/50"
            )}
            onClick={() => setExpanded(isOpen ? null : symbol.char)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-heading-md text-2xl text-on-surface leading-none">
                  {symbol.char}
                </span>
                {phonetic && (
                  <p className="text-label-sm text-on-surface-variant mt-1">{phonetic}</p>
                )}
              </div>
              <div className="flex items-center gap-xs shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    play(symbol.code);
                  }}
                  aria-label={t("common.playMorseFor", { char: symbol.char })}
                  className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors shrink-0"
                >
                  <Icon name="play" className="w-3.5 h-3.5" />
                </button>
                <Icon
                  name="chevronRight"
                  className={cn(
                    "w-3.5 h-3.5 text-on-surface-variant/50 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </div>
            </div>
            <span className="font-morse-code text-lg text-primary tracking-widest">
              {symbol.code}
            </span>

            {isOpen && (
              <div className="pt-sm mt-sm border-t border-outline-variant/30 text-sm text-on-surface-variant">
                <p className="italic mb-xs">"{mnemonic.hint}"</p>
                {mnemonic.examples.length > 0 && (
                  <p className="text-label-sm">{t("common.eg")} {mnemonic.examples.slice(0, 2).join(", ")}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
