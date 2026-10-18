import { kvGet, kvSet } from "@/lib/db";

export type AiProvider = "openai" | "anthropic" | "custom";

export interface AiSettings {
  schemaVersion: 1;
  enabled: boolean;
  provider: AiProvider;
  /** Only used when provider === "custom". Must be https. */
  customEndpoint?: string;
  /** The user's own API key. Stored ONLY here, in this device's
   * IndexedDB. Never included in kvExportAll's backup payload (see
   * lib/backup.ts), never logged, never sent anywhere except directly
   * to the configured provider's own API. */
  apiKey: string;
  /** Hard cap on response length, in tokens. Kept small and clamped
   * (see MAX_TOKENS_CEILING) so one reply can't turn into an expensive
   * request. */
  maxTokens: number;
  /** Hard cap on how many messages can be sent per rolling 24h window,
   * to prevent any bug or accidental loop from generating runaway
   * provider charges. */
  dailyMessageLimit: number;
}

export const MAX_TOKENS_CEILING = 800;
export const MAX_TOKENS_FLOOR = 100;
export const DAILY_LIMIT_CEILING = 100;
export const DAILY_LIMIT_FLOOR = 5;

export const DEFAULT_AI_SETTINGS: AiSettings = {
  schemaVersion: 1,
  enabled: false,
  provider: "openai",
  apiKey: "",
  maxTokens: 400,
  dailyMessageLimit: 30,
};

const KEY = "aiSettings";

export async function getAiSettings(): Promise<AiSettings> {
  const stored = await kvGet<AiSettings>(KEY);
  if (!stored) return DEFAULT_AI_SETTINGS;
  // Clamp on read too, in case a hand-edited/older record has looser values.
  return {
    ...DEFAULT_AI_SETTINGS,
    ...stored,
    maxTokens: clamp(stored.maxTokens ?? DEFAULT_AI_SETTINGS.maxTokens, MAX_TOKENS_FLOOR, MAX_TOKENS_CEILING),
    dailyMessageLimit: clamp(
      stored.dailyMessageLimit ?? DEFAULT_AI_SETTINGS.dailyMessageLimit,
      DAILY_LIMIT_FLOOR,
      DAILY_LIMIT_CEILING
    ),
  };
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  const clamped: AiSettings = {
    ...settings,
    maxTokens: clamp(settings.maxTokens, MAX_TOKENS_FLOOR, MAX_TOKENS_CEILING),
    dailyMessageLimit: clamp(settings.dailyMessageLimit, DAILY_LIMIT_FLOOR, DAILY_LIMIT_CEILING),
  };
  await kvSet(KEY, clamped);
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
