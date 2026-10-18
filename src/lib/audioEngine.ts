import { timingForWpm } from "@/lib/morse";

/**
 * Minimal WebAudio oscillator engine for playing Morse tones. Lazily
 * creates one AudioContext (browsers block autoplay until a user
 * gesture, so this only spins up on first play()) and reuses it for
 * every subsequent playback across the app.
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Exposes the single lazily-created AudioContext so other modules (e.g.
 * game sound effects) can schedule their own oscillators without opening
 * a second context. Browsers cap how many can run concurrently, and
 * reusing one keeps everything on the same clock.
 */
export function getSharedAudioContext(): AudioContext {
  return getContext();
}

export interface PlayOptions {
  wpm?: number;
  farnsworthWpm?: number;
  frequency?: number;
  volume?: number;
  /** Called once when playback of the whole sequence finishes. */
  onDone?: () => void;
  /** Called on every symbol boundary, useful for driving a waveform UI. */
  onSymbol?: (symbol: "." | "-", index: number) => void;
}

let activeStop: (() => void) | null = null;

/** Stop any Morse audio currently playing. */
export function stopMorseAudio() {
  activeStop?.();
  activeStop = null;
}

/**
 * Play a dot/dash string (e.g. "-.-.") as audio tones using standard
 * Morse timing. Spaces separate letters, "/" separates words; both are
 * treated as extra silence.
 */
export function playMorse(code: string, options: PlayOptions = {}) {
  stopMorseAudio();

  const {
    wpm = 15,
    farnsworthWpm,
    frequency = 600,
    volume = 0.25,
    onDone,
    onSymbol,
  } = options;

  const ctx = getContext();
  const timing = timingForWpm(wpm, farnsworthWpm);
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  let cancelled = false;
  let cursor = ctx.currentTime + 0.05;
  let symbolIndex = 0;
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  const tokens = code.trim().split("");

  for (const token of tokens) {
    if (token === "." || token === "-") {
      const durationMs = token === "." ? timing.ditMs : timing.dahMs;
      const durationSec = durationMs / 1000;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;

      // Quick fade in/out avoids audible clicks at tone edges.
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      const rampMs = Math.min(5, durationMs / 4) / 1000;
      gain.gain.setValueAtTime(0, cursor);
      gain.gain.linearRampToValueAtTime(1, cursor + rampMs);
      gain.gain.setValueAtTime(1, cursor + durationSec - rampMs);
      gain.gain.linearRampToValueAtTime(0, cursor + durationSec);

      osc.start(cursor);
      osc.stop(cursor + durationSec);

      const capturedIndex = symbolIndex++;
      const fireAt = Math.max(0, (cursor - ctx.currentTime) * 1000);
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) onSymbol?.(token, capturedIndex);
        }, fireAt)
      );

      cursor += durationSec + timing.intraCharGapMs / 1000;
    } else if (token === " ") {
      cursor += (timing.interCharGapMs - timing.intraCharGapMs) / 1000;
    } else if (token === "/") {
      cursor += (timing.wordGapMs - timing.intraCharGapMs) / 1000;
    }
  }

  const totalMs = Math.max(0, (cursor - ctx.currentTime) * 1000);
  const doneTimeout = setTimeout(() => {
    if (!cancelled) onDone?.();
  }, totalMs);
  timeouts.push(doneTimeout);

  activeStop = () => {
    cancelled = true;
    timeouts.forEach(clearTimeout);
    master.disconnect();
  };

  return activeStop;
}
