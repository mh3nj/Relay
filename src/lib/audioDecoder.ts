import { morseToText as defaultMorseToText, MORSE_TO_CHAR } from "@/lib/morse";

/**
 * Decodes an uploaded audio recording of Morse code back to text.
 * Pipeline: decode audio -> rectify + smooth into an amplitude envelope
 * -> estimate the noise floor and threshold adaptively above it ->
 * collapse into on/off runs -> debounce sub-15ms glitches (dropouts and
 * clicks too short to be real keying) -> cluster run lengths to infer
 * the unit (dit) duration -> classify each run as dot/dash/gap ->
 * reassemble into dot-dash text -> decode to plain text.
 */

export interface DecodeResult {
  morse: string;
  text: string;
  confidence: number; // 0-1, based on how tightly on/off runs cluster
  unknownSequences: string[];
}

interface Run {
  isOn: boolean;
  durationMs: number;
}

/** Runs shorter than this are treated as noise (a click or a brief
 * dropout mid-tone), never a real dot. Even at a very fast 40 WPM a
 * genuine dit is still ~30ms. */
const GLITCH_FLOOR_MS = 15;

export async function decodeAudioFile(
  file: File,
  decodeMap: Record<string, string> = MORSE_TO_CHAR
): Promise<DecodeResult> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  } finally {
    void ctx.close();
  }

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);

  // 1. Rectify + smooth into an envelope using two moving-average passes
  //    a 5ms window first (short enough to preserve fast dits), then
  //    a lighter 2ms pass to knock down single-sample noise spikes that
  //    would otherwise register as spurious on/off transitions.
  const windowSize = Math.max(1, Math.round(sampleRate * 0.005));
  const envelope = movingAverageEnvelope(movingAverageEnvelope(channelData, windowSize), Math.max(1, Math.round(sampleRate * 0.002)));

  // 2. Estimate the noise floor from the quietest 20% of samples, then
  //    threshold a bit above it rather than a flat fraction of peak,
  //    this keeps a hissy recording from being all "on".
  const peak = Math.max(...envelope);
  if (peak < 1e-6) {
    return { morse: "", text: "", confidence: 0, unknownSequences: [] };
  }
  const noiseFloor = estimateNoiseFloor(envelope);
  const threshold = Math.max(peak * 0.15, noiseFloor + (peak - noiseFloor) * 0.2);
  let runs = toRuns(envelope, threshold, sampleRate);

  if (runs.length === 0) {
    return { morse: "", text: "", confidence: 0, unknownSequences: [] };
  }

  // 3. Debounce glitches: absorb any run shorter than the noise floor
  //    into its neighbor rather than letting it fragment the signal.
  runs = debounceRuns(runs, GLITCH_FLOOR_MS);

  // 4. Infer the unit (dit) duration from the shortest cluster of "on"
  //    run lengths. Dots are the shortest sound, so the smallest
  //    cluster's mean approximates one unit.
  const onDurations = runs.filter((r) => r.isOn).map((r) => r.durationMs);
  const unitMs = inferUnitDuration(onDurations);

  // 5. Classify each run and reassemble as dot-dash Morse text.
  let out = "";
  let sawTrailingWordGap = false;
  for (const run of runs) {
    if (run.isOn) {
      out += run.durationMs < unitMs * 2 ? "." : "-";
      sawTrailingWordGap = false;
    } else {
      if (run.durationMs >= unitMs * 5.5) {
        out += " / ";
        sawTrailingWordGap = true;
      } else if (run.durationMs >= unitMs * 2) {
        out += " ";
      }
      // shorter gaps are intra-character and need no separator
    }
  }
  if (sawTrailingWordGap) out = out.trim().replace(/\/$/, "").trim();
  const morse = out.trim().replace(/\s+/g, (m) => (m.includes("/") ? " / " : " "));

  // 6. Decode, and separately flag tokens that don't map to any known
  //    character so the UI can highlight them.
  const unknownSequences = new Set<string>();
  const text = morse
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => {
          const decoded = defaultMorseToText(token, decodeMap);
          if (!decoded) unknownSequences.add(token);
          return decoded;
        })
        .join("")
    )
    .join(" ");

  const confidence = estimateConfidence(onDurations, unitMs);

  return { morse, text, confidence, unknownSequences: Array.from(unknownSequences) };
}

/** Approximates the ambient noise floor as the mean of the quietest 20%
 * of envelope samples: silence between keying still has some hiss, so
 * this is more reliable than assuming true zero. */
function estimateNoiseFloor(envelope: Float32Array): number {
  const sorted = Float32Array.from(envelope).sort();
  const cutoff = Math.max(1, Math.floor(sorted.length * 0.2));
  let sum = 0;
  for (let i = 0; i < cutoff; i++) sum += sorted[i];
  return sum / cutoff;
}

/** Absorbs any run shorter than minMs into its previous neighbor, then
 * merges any now-adjacent same-state runs the absorption created. */
function debounceRuns(runs: Run[], minMs: number): Run[] {
  if (runs.length === 0) return runs;
  const out: Run[] = [{ ...runs[0] }];

  for (let i = 1; i < runs.length; i++) {
    const r = runs[i];
    const prev = out[out.length - 1];
    if (r.durationMs < minMs || prev.isOn === r.isOn) {
      prev.durationMs += r.durationMs;
    } else {
      out.push({ ...r });
    }
  }

  // The very first run could itself be a glitch with nothing before it
  // to absorb into, so fold it forward instead.
  if (out.length > 1 && out[0].durationMs < minMs) {
    out[1].durationMs += out[0].durationMs;
    out.shift();
  }

  return out;
}

function movingAverageEnvelope(data: Float32Array, windowSize: number): Float32Array {
  const rectified = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) rectified[i] = Math.abs(data[i]);

  const out = new Float32Array(data.length);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += rectified[i];
    if (i >= windowSize) sum -= rectified[i - windowSize];
    out[i] = sum / Math.min(i + 1, windowSize);
  }
  return out;
}

function toRuns(envelope: Float32Array, threshold: number, sampleRate: number): Run[] {
  const runs: Run[] = [];
  let currentIsOn = envelope[0] > threshold;
  let runStart = 0;

  for (let i = 1; i < envelope.length; i++) {
    const isOn = envelope[i] > threshold;
    if (isOn !== currentIsOn) {
      runs.push({
        isOn: currentIsOn,
        durationMs: ((i - runStart) / sampleRate) * 1000,
      });
      runStart = i;
      currentIsOn = isOn;
    }
  }
  runs.push({
    isOn: currentIsOn,
    durationMs: ((envelope.length - runStart) / sampleRate) * 1000,
  });

  // Drop leading/trailing silence and ignore sub-5ms noise blips.
  return runs.filter((r) => r.durationMs > 5);
}

/** Estimate the dit unit duration via simple 2-means clustering on "on"
 * run lengths (dots cluster short, dashes cluster ~3x longer). */
function inferUnitDuration(onDurations: number[]): number {
  if (onDurations.length === 0) return 80; // sane default (~15 WPM)
  if (onDurations.length === 1) return onDurations[0];

  const sorted = [...onDurations].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];

  let shortSum = 0;
  let shortCount = 0;
  for (const d of sorted) {
    if (d <= mid) {
      shortSum += d;
      shortCount++;
    }
  }
  return shortCount > 0 ? shortSum / shortCount : sorted[0];
}

/** Rough confidence score: how tightly "dot-like" durations cluster
 * around the inferred unit, normalized to 0 to 1. */
function estimateConfidence(onDurations: number[], unitMs: number): number {
  if (onDurations.length === 0) return 0;
  const dotLike = onDurations.filter((d) => d < unitMs * 2);
  if (dotLike.length === 0) return 0.5;
  const variance =
    dotLike.reduce((acc, d) => acc + (d - unitMs) ** 2, 0) / dotLike.length;
  const stdDev = Math.sqrt(variance);
  const relativeSpread = stdDev / unitMs;
  return Math.max(0, Math.min(1, 1 - relativeSpread));
}
