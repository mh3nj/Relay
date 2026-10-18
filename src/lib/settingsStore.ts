import { kvGet, kvSet } from "@/lib/db";

export type ThemeName =
  | "dark"
  | "light"
  | "midnight"
  | "ocean"
  | "forest"
  | "coffee"
  | "frost"
  | "sunrise";

const THEME_KEY = "themeName";

export async function getTheme(): Promise<ThemeName> {
  return (await kvGet<ThemeName>(THEME_KEY)) ?? "dark";
}

export async function setTheme(theme: ThemeName): Promise<void> {
  await kvSet(THEME_KEY, theme);
}

export interface AudioDefaults {
  wpm: number;
  farnsworthWpm: number | null;
  frequency: number;
  volume: number; // 0-1
}

export const DEFAULT_AUDIO_DEFAULTS: AudioDefaults = {
  wpm: 18,
  farnsworthWpm: null,
  frequency: 600,
  volume: 0.25,
};

const AUDIO_KEY = "audioDefaults";

export async function getAudioDefaults(): Promise<AudioDefaults> {
  const stored = await kvGet<Partial<AudioDefaults>>(AUDIO_KEY);
  return { ...DEFAULT_AUDIO_DEFAULTS, ...stored };
}

export async function setAudioDefaults(defaults: AudioDefaults): Promise<void> {
  await kvSet(AUDIO_KEY, defaults);
}

export type TextSize = "small" | "default" | "large";

export interface AccessibilitySettings {
  highContrast: boolean;
  textSize: TextSize;
  /** null = follow the OS prefers-reduced-motion setting; true/false
   * explicitly overrides it. */
  reducedMotionOverride: boolean | null;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  textSize: "default",
  reducedMotionOverride: null,
};

const ACCESSIBILITY_KEY = "accessibilitySettings";

export async function getAccessibilitySettings(): Promise<AccessibilitySettings> {
  const stored = await kvGet<Partial<AccessibilitySettings>>(ACCESSIBILITY_KEY);
  return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...stored };
}

export async function setAccessibilitySettings(settings: AccessibilitySettings): Promise<void> {
  await kvSet(ACCESSIBILITY_KEY, settings);
}
