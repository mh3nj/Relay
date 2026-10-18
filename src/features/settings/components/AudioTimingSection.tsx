import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getAudioDefaults,
  setAudioDefaults,
  DEFAULT_AUDIO_DEFAULTS,
} from "@/lib/settingsStore";
import type { AudioDefaults } from "@/lib/settingsStore";

export function AudioTimingSection() {
  const { t } = useTranslation();
  const [defaults, setDefaults] = useState<AudioDefaults>(DEFAULT_AUDIO_DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void getAudioDefaults().then((d) => {
      setDefaults(d);
      setLoaded(true);
    });
  }, []);

  const update = (partial: Partial<AudioDefaults>) => {
    const next = { ...defaults, ...partial };
    setDefaults(next);
    void setAudioDefaults(next);
  };

  if (!loaded) return null;

  return (
    <Card className="p-lg flex flex-col gap-lg">
      <div>
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("settings.audioSettings.title")}
        </h3>
        <p className="text-label-sm text-on-surface-variant mt-xs">
          {t("settings.audioSettings.description")}
        </p>
      </div>

      <div className="space-y-xs">
        <div className="flex justify-between text-label-sm text-on-surface-variant">
          <label htmlFor="default-wpm">{t("settings.audioSettings.wpm")}</label>
          <span>{defaults.wpm} wpm</span>
        </div>
        <input
          id="default-wpm"
          type="range"
          min={5}
          max={40}
          value={defaults.wpm}
          onChange={(e) => update({ wpm: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div className="space-y-xs">
        <div className="flex justify-between text-label-sm text-on-surface-variant">
          <label htmlFor="farnsworth">{t("settings.audioSettings.farnsworth")}</label>
          <span>
            {defaults.farnsworthWpm === null
              ? t("settings.audioSettings.farnsworthOff")
              : `${defaults.farnsworthWpm} wpm`}
          </span>
        </div>
        <input
          id="farnsworth"
          type="range"
          min={5}
          max={defaults.wpm}
          value={defaults.farnsworthWpm ?? defaults.wpm}
          onChange={(e) => {
            const value = Number(e.target.value);
            update({ farnsworthWpm: value >= defaults.wpm ? null : value });
          }}
          className="w-full accent-primary"
        />
        <p className="text-[0.6875rem] text-on-surface-variant">{t("settings.audioSettings.farnsworthHelp")}</p>
      </div>

      <div className="space-y-xs">
        <div className="flex justify-between text-label-sm text-on-surface-variant">
          <label htmlFor="default-freq">{t("settings.audioSettings.frequency")}</label>
          <span>{defaults.frequency} Hz</span>
        </div>
        <input
          id="default-freq"
          type="range"
          min={400}
          max={1000}
          step={10}
          value={defaults.frequency}
          onChange={(e) => update({ frequency: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div className="space-y-xs">
        <div className="flex justify-between text-label-sm text-on-surface-variant">
          <label htmlFor="default-volume">{t("settings.audioSettings.volume")}</label>
          <span>{Math.round(defaults.volume * 100)}%</span>
        </div>
        <input
          id="default-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={defaults.volume}
          onChange={(e) => update({ volume: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          setDefaults(DEFAULT_AUDIO_DEFAULTS);
          void setAudioDefaults(DEFAULT_AUDIO_DEFAULTS);
        }}
      >
        {t("settings.audioSettings.reset")}
      </Button>
    </Card>
  );
}
