import { useEffect, useState } from "react";
import { getAudioDefaults, DEFAULT_AUDIO_DEFAULTS } from "@/lib/settingsStore";
import type { AudioDefaults } from "@/lib/settingsStore";

/**
 * Returns the person's saved audio defaults (Settings > Audio & Timing)
 * wpm, Farnsworth spacing, tone frequency, and volume, starting from
 * the built-in defaults and updating once the real stored values load.
 *
 * Prefer this wherever playback happens: wpm used to be the only
 * setting that reached real playback: frequency, volume, and
 * Farnsworth spacing were all configurable in Settings but silently
 * discarded everywhere audio actually played.
 */
export function useAudioDefaults(): AudioDefaults {
  const [defaults, setDefaults] = useState<AudioDefaults>(DEFAULT_AUDIO_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    void getAudioDefaults().then((d) => {
      if (!cancelled) setDefaults(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return defaults;
}
