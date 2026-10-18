import { kvGet, kvSet } from "@/lib/db";

/**
 * One completed timed session (Speed Mode or a game run).
 * Entries are written when a session ends with a WPM and accuracy
 * figure, and Progress's trend chart reads straight from this log.
 */
export interface SessionLogEntry {
  date: string; // ISO timestamp
  wpm: number;
  accuracy: number; // 0-100
  source: "speed" | "morseInvaders" | "signalRush" | "decodeTranslate" | "morseMatch" | "emergencyRelay";
}

const KEY = "sessionLog";
const MAX_ENTRIES = 200;

export async function appendSessionLog(entry: SessionLogEntry): Promise<void> {
  const existing = (await kvGet<SessionLogEntry[]>(KEY)) ?? [];
  const next = [...existing, entry].slice(-MAX_ENTRIES);
  await kvSet(KEY, next);
}

export async function getSessionLog(): Promise<SessionLogEntry[]> {
  return (await kvGet<SessionLogEntry[]>(KEY)) ?? [];
}

const PRACTICE_SECONDS_KEY = "totalPracticeSeconds";

/** Adds real elapsed seconds from a just-finished timed session. Never
 * estimated or incremented speculatively. */
export async function addPracticeSeconds(seconds: number): Promise<void> {
  const current = (await kvGet<number>(PRACTICE_SECONDS_KEY)) ?? 0;
  await kvSet(PRACTICE_SECONDS_KEY, current + Math.max(0, Math.round(seconds)));
}

export async function getTotalPracticeSeconds(): Promise<number> {
  return (await kvGet<number>(PRACTICE_SECONDS_KEY)) ?? 0;
}
