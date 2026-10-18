import { KOCH_ORDER } from "@/lib/morse";
import { overallMasteryPercent } from "@/lib/mastery";
import type { SymbolStat } from "@/types/learn";
import type { GameId } from "@/lib/highScores";
import type { IconName } from "@/components/ui/Icon";

export type BadgeCategory =
  | "learning"
  | "speed"
  | "accuracy"
  | "consistency"
  | "exploration"
  | "milestone";

export interface BadgeDef {
  id: string;
  category: BadgeCategory;
  icon: IconName;
  labelKey: string;
  earned: boolean;
}

export interface BadgeInputs {
  lessonIndex: number;
  symbolStats: Record<string, SymbolStat>;
  maxSessionWpm: number;
  streakDays: number;
  playedGames: GameId[];
  level: number;
}

/** Every condition reads from persisted state, with no
 * badge is ever marked earned speculatively. */
export function computeBadges(inputs: BadgeInputs): BadgeDef[] {
  const { lessonIndex, symbolStats, maxSessionWpm, streakDays, playedGames, level } = inputs;

  const masteryPercent = overallMasteryPercent(symbolStats, lessonIndex);
  const hasPerfectSymbol = Object.values(symbolStats).some(
    (s) => s.attempts >= 10 && s.correct === s.attempts
  );

  return [
    {
      id: "first-lesson",
      category: "learning",
      icon: "brain",
      labelKey: "progress.badges.firstLesson",
      earned: lessonIndex > 0,
    },
    {
      id: "halfway",
      category: "learning",
      icon: "learn",
      labelKey: "progress.badges.halfway",
      earned: lessonIndex >= Math.floor(KOCH_ORDER.length / 2),
    },
    {
      id: "full-alphabet",
      category: "learning",
      icon: "trophy",
      labelKey: "progress.badges.fullAlphabet",
      earned: lessonIndex >= KOCH_ORDER.length - 1,
    },
    {
      id: "wpm-10",
      category: "speed",
      icon: "speed",
      labelKey: "progress.badges.wpm10",
      earned: maxSessionWpm >= 10,
    },
    {
      id: "wpm-20",
      category: "speed",
      icon: "gauge",
      labelKey: "progress.badges.wpm20",
      earned: maxSessionWpm >= 20,
    },
    {
      id: "perfect-ear",
      category: "accuracy",
      icon: "ear",
      labelKey: "progress.badges.perfectEar",
      earned: hasPerfectSymbol,
    },
    {
      id: "sharp-shooter",
      category: "accuracy",
      icon: "target",
      labelKey: "progress.badges.sharpShooter",
      earned: masteryPercent >= 90,
    },
    {
      id: "streak-3",
      category: "consistency",
      icon: "flame",
      labelKey: "progress.badges.streak3",
      earned: streakDays >= 3,
    },
    {
      id: "streak-7",
      category: "consistency",
      icon: "flame",
      labelKey: "progress.badges.streak7",
      earned: streakDays >= 7,
    },
    {
      id: "streak-30",
      category: "consistency",
      icon: "flame",
      labelKey: "progress.badges.streak30",
      earned: streakDays >= 30,
    },
    {
      id: "game-explorer",
      category: "exploration",
      icon: "games",
      labelKey: "progress.badges.gameExplorer",
      earned: playedGames.includes("morseInvaders") && playedGames.includes("signalRush"),
    },
    {
      id: "level-5",
      category: "milestone",
      icon: "star",
      labelKey: "progress.badges.level5",
      earned: level >= 5,
    },
    {
      id: "level-10",
      category: "milestone",
      icon: "medal",
      labelKey: "progress.badges.level10",
      earned: level >= 10,
    },
  ];
}
