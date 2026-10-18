import type { BadgeDef } from "@/lib/badges";
import type { XpProgress } from "@/lib/xp";
import type { WpmDataPoint, WpmRange } from "@/features/dashboard/lib/wpmHistory";

export interface WeakSymbol {
  char: string;
  code: string;
  accuracy: number; // 0-100
}

export interface DashboardStats {
  streakDays: number;
  currentLessonChar: string;
  currentLessonCode: string;
  overallMasteryPct: number;
  dailyChallenge: {
    labelKey: string;
    target: number;
    done: number;
    total: number;
  };
  weakSymbols: WeakSymbol[];
  badges: BadgeDef[];
  wpmHistoryByRange: Record<WpmRange, WpmDataPoint[]>;
  xpProgress: XpProgress;
}
