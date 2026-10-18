import { getSharedAudioContext } from "@/lib/audioEngine";

/**
 * Tiny WebAudio "juice" layer for the mini-games: short chimes and buzzes
 * that are distinct from the dot/dash Morse tone so players get instant,
 * game-y feedback without confusing it for the signal itself. All tones
 * share the app's single AudioContext (see audioEngine.ts).
 */

function scheduleTone(
  ctx: AudioContext,
  master: GainNode,
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;

  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(master);

  const start = ctx.currentTime + startOffsetSec;
  const rampSec = Math.min(0.012, durationSec / 4);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(1, start + rampSec);
  gain.gain.setValueAtTime(1, Math.max(start + rampSec, start + durationSec - rampSec));
  gain.gain.linearRampToValueAtTime(0, start + durationSec);

  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

function playChime(freqs: number[], volume = 0.16, type: OscillatorType = "sine") {
  try {
    const ctx = getSharedAudioContext();
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    freqs.forEach((f, i) => scheduleTone(ctx, master, f, i * 0.055, 0.13, type));
    const totalMs = freqs.length * 55 + 220;
    setTimeout(() => master.disconnect(), totalMs);
  } catch {
    // Audio is best-effort (e.g. autoplay policies, unsupported browsers).
  }
}

/** Bright ascending two-note chime for a correct answer. */
export function playCorrectSfx() {
  playChime([880, 1318.51]);
}

/** Low descending buzz for a wrong answer or a lost life. */
export function playWrongSfx() {
  try {
    const ctx = getSharedAudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);
    scheduleTone(ctx, master, 220, 0, 0.09, "sawtooth");
    scheduleTone(ctx, master, 160, 0.09, 0.14, "sawtooth");
    setTimeout(() => master.disconnect(), 320);
  } catch {
    // no-op
  }
}

/** Short rising arpeggio whose pitch climbs with combo tier. Rewards streaks. */
export function playComboSfx(tier: number) {
  const base = 660 + Math.min(tier, 8) * 44;
  playChime([base, base * 1.25, base * 1.5], 0.14);
}

/** Full four-note fanfare for a new high score. */
export function playHighScoreSfx() {
  playChime([523.25, 659.25, 783.99, 1046.5], 0.2);
}

/** Soft descending tone marking a run's end (neutral, not punitive). */
export function playGameOverSfx() {
  playChime([440, 329.63], 0.15);
}
