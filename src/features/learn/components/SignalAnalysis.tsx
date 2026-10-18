import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { timingForWpm } from "@/lib/morse";

interface SignalAnalysisProps {
  code: string;
  wpm: number;
  isPlaying: boolean;
  activeSymbolIndex: number;
  onPlay: () => void;
  onStop: () => void;
}

export function SignalAnalysis({
  code,
  wpm,
  isPlaying,
  activeSymbolIndex,
  onPlay,
  onStop,
}: SignalAnalysisProps) {
  const { t } = useTranslation();
  const symbols = code.split("");
  const ditMs = Math.round(timingForWpm(wpm).ditMs);

  return (
    <div className="lg:col-span-8 bg-surface-container border border-outline-variant/30 rounded-xl p-lg flex flex-col relative">
      <div className="flex justify-between items-start mb-md">
        <div>
          <h3 className="font-heading-md text-heading-md text-on-surface">
            {t("learn.signalAnalysis")}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {symbols.length === 1
              ? t("learn.oneUnitDuration")
              : t("learn.unitsWithGap", { count: symbols.length })}
          </p>
        </div>
        <button
          onClick={isPlaying ? onStop : onPlay}
          aria-label={isPlaying ? t("learn.stopPlayback") ?? "" : t("learn.playAudio") ?? ""}
          className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_14px_rgba(192,193,255,0.3)] hover:scale-105 transition-transform active:scale-95"
        >
          {isPlaying ? (
            <Icon name="stop" className="w-5 h-5" />
          ) : (
            <Icon name="play" className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="flex-1 bg-surface-container-lowest rounded-lg border border-outline-variant/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col p-md min-h-[180px]">
        <div className="flex border-b border-outline-variant/30 pb-xs mb-md text-[0.625rem] text-on-surface-variant font-mono tracking-widest">
          <div className="flex-1">{t("learn.start")}</div>
          <div className="flex-1 text-center">{t("learn.signal")}</div>
          <div className="flex-1 text-right">{t("learn.end")}</div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-3 relative">
          {symbols.map((symbol, i) => {
            const isDash = symbol === "-";
            const active = isPlaying && activeSymbolIndex === i;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "rounded-full bg-primary transition-all duration-150",
                    isDash ? "w-10 h-6" : "w-6 h-6",
                    active ? "shadow-[0_0_15px_rgba(192,193,255,1)] scale-110" : "opacity-40"
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-md self-start bg-surface-container px-sm py-xs rounded border border-outline-variant/50 flex items-center gap-xs font-label-sm text-label-sm">
        <span className={cn("w-2 h-2 rounded-full bg-primary", isPlaying && "animate-pulse")} />
        <span className="text-on-surface font-mono">{t("learn.unitTiming", { ms: ditMs, wpm })}</span>
      </div>
    </div>
  );
}
