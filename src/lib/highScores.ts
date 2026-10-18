import { kvGet, kvSet } from "@/lib/db";

export type GameId = "morseInvaders" | "signalRush" | "decodeTranslate" | "morseMatch" | "emergencyRelay";

function keyFor(game: GameId): string {
  return `highScore:${game}`;
}

export async function getHighScore(game: GameId): Promise<number> {
  return (await kvGet<number>(keyFor(game))) ?? 0;
}

/** Persists the new high score only if it's actually higher. Returns
 * whether this run set a new record. */
export async function maybeSetHighScore(game: GameId, score: number): Promise<boolean> {
  const current = await getHighScore(game);
  if (score > current) {
    await kvSet(keyFor(game), score);
    return true;
  }
  return false;
}

const PLAYED_KEY = "gamesPlayed";

/** Marks a game as started at least once. Backs the
 * "Game Explorer" badge with real play history, not a guess. */
export async function markGamePlayed(game: GameId): Promise<void> {
  const played = (await kvGet<GameId[]>(PLAYED_KEY)) ?? [];
  if (!played.includes(game)) {
    await kvSet(PLAYED_KEY, [...played, game]);
  }
}

export async function getPlayedGames(): Promise<GameId[]> {
  return (await kvGet<GameId[]>(PLAYED_KEY)) ?? [];
}
