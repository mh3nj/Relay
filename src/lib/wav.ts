import { timingForWpm } from "@/lib/morse";

export interface SynthesizeOptions {
  wpm?: number;
  farnsworthWpm?: number;
  frequency?: number;
  volume?: number;
  sampleRate?: number;
}

/**
 * Directly synthesizes Morse audio as PCM float samples, no AudioContext
 * involved, so this can run instantly and deterministically to produce a
 * downloadable file, independent of whatever is currently playing through
 * the live audio engine.
 */
export function synthesizeMorsePcm(code: string, options: SynthesizeOptions = {}): Float32Array {
  const {
    wpm = 15,
    farnsworthWpm,
    frequency = 600,
    volume = 0.4,
    sampleRate = 44100,
  } = options;

  const timing = timingForWpm(wpm, farnsworthWpm);
  const leadInSec = 0.05;
  const tailSec = 0.05;

  // First pass: compute total duration.
  let totalSec = leadInSec + tailSec;
  for (const token of code) {
    if (token === ".") totalSec += timing.ditMs / 1000 + timing.intraCharGapMs / 1000;
    else if (token === "-") totalSec += timing.dahMs / 1000 + timing.intraCharGapMs / 1000;
    else if (token === " ") totalSec += (timing.interCharGapMs - timing.intraCharGapMs) / 1000;
    else if (token === "/") totalSec += (timing.wordGapMs - timing.intraCharGapMs) / 1000;
  }

  const totalSamples = Math.ceil(totalSec * sampleRate);
  const samples = new Float32Array(totalSamples);

  let cursorSec = leadInSec;
  const rampSec = 0.003;

  for (const token of code) {
    if (token === "." || token === "-") {
      const durationSec = (token === "." ? timing.ditMs : timing.dahMs) / 1000;
      const startSample = Math.floor(cursorSec * sampleRate);
      const endSample = Math.min(totalSamples, Math.floor((cursorSec + durationSec) * sampleRate));

      for (let i = startSample; i < endSample; i++) {
        const t = (i - startSample) / sampleRate;
        // Linear fade in/out over `rampSec` to avoid clicks at edges.
        const envelope = Math.min(1, t / rampSec, (durationSec - t) / rampSec);
        samples[i] += Math.sin(2 * Math.PI * frequency * t) * volume * Math.max(0, envelope);
      }
      cursorSec += durationSec + timing.intraCharGapMs / 1000;
    } else if (token === " ") {
      cursorSec += (timing.interCharGapMs - timing.intraCharGapMs) / 1000;
    } else if (token === "/") {
      cursorSec += (timing.wordGapMs - timing.intraCharGapMs) / 1000;
    }
  }

  return samples;
}

/** Encode mono Float32 PCM samples (-1..1) into a 16-bit WAV file Blob. */
export function encodeWav(samples: Float32Array, sampleRate = 44100): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Synthesize Morse audio for `code` and return it as a downloadable WAV Blob. */
export function renderMorseToWavBlob(code: string, options: SynthesizeOptions = {}): Blob {
  const samples = synthesizeMorsePcm(code, options);
  return encodeWav(samples, options.sampleRate ?? 44100);
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
