import { timingForWpm } from "@/lib/morse";

/**
 * Renders a dot/dash string to a real WAV file using OfflineAudioContext
 * the same oscillator/timing approach as the live playback engine in
 * audioEngine.ts, but rendered to a buffer instead of speakers so it can
 * be downloaded.
 */

interface RenderOptions {
  wpm?: number;
  farnsworthWpm?: number;
  frequency?: number;
  sampleRate?: number;
}

export async function renderMorseToWavBlob(
  code: string,
  options: RenderOptions = {}
): Promise<Blob> {
  const { wpm = 15, farnsworthWpm, frequency = 600, sampleRate = 44100 } = options;
  const timing = timingForWpm(wpm, farnsworthWpm);

  // Compute total duration up front so we can size the offline context.
  let totalMs = 200; // lead-in silence
  for (const token of code.trim()) {
    if (token === ".") totalMs += timing.ditMs + timing.intraCharGapMs;
    else if (token === "-") totalMs += timing.dahMs + timing.intraCharGapMs;
    else if (token === " ") totalMs += timing.interCharGapMs - timing.intraCharGapMs;
    else if (token === "/") totalMs += timing.wordGapMs - timing.intraCharGapMs;
  }
  totalMs += 200; // tail silence

  const totalFrames = Math.ceil((totalMs / 1000) * sampleRate);
  const ctx = new OfflineAudioContext(1, Math.max(totalFrames, sampleRate), sampleRate);

  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  let cursor = 0.1;
  for (const token of code.trim()) {
    if (token === "." || token === "-") {
      const durationMs = token === "." ? timing.ditMs : timing.dahMs;
      const durationSec = durationMs / 1000;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;

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

      cursor += durationSec + timing.intraCharGapMs / 1000;
    } else if (token === " ") {
      cursor += (timing.interCharGapMs - timing.intraCharGapMs) / 1000;
    } else if (token === "/") {
      cursor += (timing.wordGapMs - timing.intraCharGapMs) / 1000;
    }
  }

  const rendered = await ctx.startRendering();
  return audioBufferToWavBlob(rendered);
}

/** Encode a mono/stereo AudioBuffer as a 16-bit PCM WAV Blob. */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
