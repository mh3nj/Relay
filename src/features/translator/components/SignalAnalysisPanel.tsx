import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface SignalAnalysisPanelProps {
  code: string;
  isPlaying: boolean;
  activeSymbolIndex: number;
  wpm: number;
  frequency: number;
  onWpmChange: (wpm: number) => void;
  onFrequencyChange: (freq: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

export function SignalAnalysisPanel({
  code,
  isPlaying,
  activeSymbolIndex,
  wpm,
  frequency,
  onWpmChange,
  onFrequencyChange,
  onPlay,
  onStop,
}: SignalAnalysisPanelProps) {
  const { t } = useTranslation();
  const tokens = code.split("");
  let symbolCursor = -1;

  return (
    <Card className="lg:col-span-2 p-lg flex flex-col">
      <div className="flex justify-between items-center mb-lg">
        <h3 className="font-heading-md text-heading-md text-on-surface flex items-center gap-sm">
          <Icon name="waveform" className="w-5 h-5 text-primary" />
          {t("learn.signalAnalysis")}
        </h3>
      </div>

      {/* Waveform display, derived from the real dot/dash/gap sequence */}
      <div className="h-32 bg-waveform-well rounded-lg border border-outline-variant/30 mb-lg flex items-center px-md overflow-x-auto">
        {tokens.length === 0 ? (
          <p className="text-on-surface-variant text-sm w-full text-center">
            {t("translator.typeToSeeSignal")}
          </p>
        ) : (
          <div className="flex items-end h-[80%] gap-1 min-w-max">
            {tokens.map((token, i) => {
              if (token === "." || token === "-") {
                symbolCursor++;
                const active = isPlaying && activeSymbolIndex === symbolCursor;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-sm transition-all duration-150",
                      token === "-" ? "w-6" : "w-2",
                      active ? "bg-primary shadow-[0_0_10px_rgba(192,193,255,0.8)]" : "bg-primary/50"
                    )}
                    style={{ height: active ? "100%" : "60%" }}
                  />
                );
              }
              return <div key={i} className={token === "/" ? "w-6" : "w-3"} />;
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-lg mt-auto">
        <div className="flex items-center gap-sm">
          <button
            onClick={isPlaying ? onStop : onPlay}
            disabled={!code}
            aria-label={isPlaying ? t("learn.stopPlayback") ?? "" : t("learn.playAudio") ?? ""}
            className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Icon name="stop" className="w-5 h-5" />
            ) : (
              <Icon name="play" className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-lg gap-y-sm w-full">
          <div className="space-y-xs">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <label htmlFor="wpm-slider">{t("translator.speedWpm")}</label>
              <span>{wpm} wpm</span>
            </div>
            <input
              id="wpm-slider"
              type="range"
              min={5}
              max={40}
              value={wpm}
              onChange={(e) => onWpmChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div className="space-y-xs">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <label htmlFor="tone-slider">{t("translator.toneHz")}</label>
              <span>{frequency} Hz</span>
            </div>
            <input
              id="tone-slider"
              type="range"
              min={400}
              max={1000}
              step={10}
              value={frequency}
              onChange={(e) => onFrequencyChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
