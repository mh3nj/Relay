import { useCallback, useEffect, useRef, useState } from "react";
import { playMorse, stopMorseAudio } from "@/lib/audioEngine";

export interface MorsePlayerOptions {
  frequency?: number;
  volume?: number;
  farnsworthWpm?: number;
}

export function useMorsePlayer(wpm = 15, options: MorsePlayerOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSymbolIndex, setActiveSymbolIndex] = useState(-1);
  const mounted = useRef(true);
  const { frequency, volume, farnsworthWpm } = options;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopMorseAudio();
    };
  }, []);

  const play = useCallback(
    (code: string) => {
      setIsPlaying(true);
      setActiveSymbolIndex(-1);
      playMorse(code, {
        wpm,
        frequency,
        volume,
        farnsworthWpm,
        onSymbol: (_symbol, index) => {
          if (mounted.current) setActiveSymbolIndex(index);
        },
        onDone: () => {
          if (mounted.current) {
            setIsPlaying(false);
            setActiveSymbolIndex(-1);
          }
        },
      });
    },
    [wpm, frequency, volume, farnsworthWpm]
  );

  const stop = useCallback(() => {
    stopMorseAudio();
    setIsPlaying(false);
    setActiveSymbolIndex(-1);
  }, []);

  return { play, stop, isPlaying, activeSymbolIndex };
}
