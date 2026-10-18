import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PROSIGNS } from "@/lib/encyclopediaData";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";

interface ProsignsTableProps {
  /** Search text, matched against name/code/meaning, same as
   * CharacterGrid's filtering, so a search applies consistently across
   * the whole page instead of silently leaving prosigns unfiltered. */
  query?: string;
}

export function ProsignsTable({ query = "" }: ProsignsTableProps) {
  const { t } = useTranslation();
  const audioDefaults = useAudioDefaults();
  const { play } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });

  const q = query.trim().toUpperCase();
  const filtered = q
    ? PROSIGNS.filter(
        (p) =>
          p.name.toUpperCase().includes(q) ||
          p.code.includes(q) ||
          p.meaning.toUpperCase().includes(q)
      )
    : PROSIGNS;

  return (
    <Card className="p-lg">
      <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
        {t("encyclopedia.prosignsTitle")}
      </h3>
      {filtered.length === 0 ? (
        <p className="text-on-surface-variant text-sm py-lg text-center">
          {t("encyclopedia.noResults")}
        </p>
      ) : (
        <div className="divide-y divide-outline-variant/20">
          {filtered.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-sm gap-md">
              <div className="flex items-center gap-md min-w-0">
                <span className="font-bold text-on-surface w-16 shrink-0">{p.name}</span>
                <span className="font-morse-code text-primary text-sm tracking-widest shrink-0">
                  {p.code}
                </span>
                <span className="text-sm text-on-surface-variant truncate">{p.meaning}</span>
              </div>
              <button
                onClick={() => play(p.code)}
                aria-label={t("common.playMorseFor", { char: p.name })}
                className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors shrink-0"
              >
                <Icon name="play" className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
