import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { DEFAULT_ALPHABET } from "@/lib/morse";
import { appendSessionLog, addPracticeSeconds } from "@/lib/sessionLog";
import { getHighScore, maybeSetHighScore, markGamePlayed } from "@/lib/highScores";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { playCorrectSfx, playWrongSfx, playComboSfx, playHighScoreSfx } from "@/lib/gameSfx";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";
import { ComboBadge } from "@/features/games/components/fx/ComboBadge";
import { GameStat } from "@/features/games/components/fx/GameStat";
import { useCombo } from "@/features/games/hooks/useCombo";

type Difficulty = "easy" | "hard";

interface MorseMatchProps {
  onExit: () => void;
}

interface MatchCard {
  id: number;
  pairId: number;
  display: string;
  type: "letter" | "code";
  flipped: boolean;
  matched: boolean;
  justMatched: boolean;
}

const PAIRS_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 8,
  hard: 18,
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(count: number): MatchCard[] {
  const sourcePool = DEFAULT_ALPHABET.filter((s) => s.category === "letter" || s.category === "number");
  const shuffled = shuffleArray(sourcePool);
  const selected = shuffled.slice(0, count);

  const cards: MatchCard[] = [];
  selected.forEach((entry, i) => {
    cards.push({ id: i * 2, pairId: i, display: entry.char, type: "letter", flipped: false, matched: false, justMatched: false });
    cards.push({ id: i * 2 + 1, pairId: i, display: entry.code, type: "code", flipped: false, matched: false, justMatched: false });
  });
  return shuffleArray(cards);
}

export function MorseMatch({ onExit }: MorseMatchProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [pairsFound, setPairsFound] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [flipCount, setFlipCount] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [grid, setGrid] = useState<"4x4" | "6x6">("4x4");
  const [burstId, setBurstId] = useState(0);

  const { combo, best: bestCombo, bump: bumpCombo, reset: resetCombo, resetAll: resetComboAll } = useCombo();
  const lockRef = useRef(false);
  const startedAt = useRef(0);

  useEffect(() => {
    void getHighScore("morseMatch").then(setHighScore);
  }, []);

  // Resolve a completed pair. Every side effect (combo, sound, particle
  // burst, flip-back timer) happens here rather than inside a setCards
  // updater: React may invoke an updater more than once, which would
  // otherwise a single match scores twice and ends the round early.
  const resolvePair = useCallback(
    (idA: number, idB: number) => {
      const cardA = cards.find((c) => c.id === idA);
      const cardB = cards.find((c) => c.id === idB);
      const isMatch =
        !!cardA && !!cardB && cardA.pairId === cardB.pairId && cardA.type !== cardB.type;

      if (isMatch) {
        bumpCombo();
        setBurstId((b) => b + 1);
        playCorrectSfx();
        const nextPairs = pairsFound + 1;
        setPairsFound(nextPairs);
        if (nextPairs % 3 === 0) playComboSfx(Math.floor(nextPairs / 3));
        setCards((prev) =>
          prev.map((c) =>
            c.id === idA || c.id === idB ? { ...c, matched: true, justMatched: true } : c
          )
        );
        return;
      }

      playWrongSfx();
      resetCombo();
      setTimeout(() => {
        setCards((p) => p.map((c) => (c.id === idA || c.id === idB ? { ...c, flipped: false } : c)));
      }, 700);
    },
    [cards, pairsFound, bumpCombo, resetCombo]
  );

  useEffect(() => {
    if (flippedIds.length !== 2) return;
    const [idA, idB] = flippedIds;
    lockRef.current = true;
    setFlipCount((prev) => prev + 1);
    setFlippedIds([]);
    resolvePair(idA, idB);
    setTimeout(() => {
      lockRef.current = false;
    }, 800);
  }, [flippedIds, resolvePair]);

  useEffect(() => {
    if (phase === "playing" && pairsFound === totalPairs && totalPairs > 0) {
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
      const timeBonus = Math.max(0, Math.floor((120 - elapsed) / 2));
      const finalScore = pairsFound * 10 + timeBonus;
      setScore(finalScore);
      setPhase("over");
      const efficiency = Math.min(100, Math.round((totalPairs / Math.max(1, flipCount)) * 100));
      void maybeSetHighScore("morseMatch", finalScore).then((isHigh) => {
        setIsNewHigh(isHigh);
        if (isHigh) playHighScoreSfx();
        setHighScore((prev) => Math.max(prev, finalScore));
      });
      void appendSessionLog({
        date: new Date().toISOString(),
        wpm: 0,
        accuracy: efficiency,
        source: "morseMatch",
      });
      void addPracticeSeconds(elapsed);
      if (efficiency >= 70) void awardXp(XP_REWARDS.strongSessionBonus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsFound, totalPairs, phase]);

  const handleFlip = (id: number) => {
    if (lockRef.current || phase !== "playing") return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    if (flippedIds.length < 2) {
      setFlippedIds((prev) => [...prev, id]);
    }
  };

  const start = (diff: Difficulty) => {
    void markGamePlayed("morseMatch");
    const count = PAIRS_PER_DIFFICULTY[diff];
    lockRef.current = false;
    setDifficulty(diff);
    setCards(buildCards(count));
    setFlippedIds([]);
    setPairsFound(0);
    setTotalPairs(count);
    setFlipCount(0);
    setScore(0);
    setGrid(diff === "easy" ? "4x4" : "6x6");
    setIsNewHigh(false);
    resetComboAll();
    setBurstId(0);
    startedAt.current = Date.now();
    setPhase("playing");
  };

  const efficiency = flipCount > 0 ? Math.min(100, Math.round((totalPairs / flipCount) * 100)) : 100;

  if (phase === "idle") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <Icon name="brain" className="w-10 h-10 text-primary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("games.morseMatch.title")}
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-sm">
          {t("games.morseMatch.instructions")}
        </p>
        {highScore > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            {t("games.morseMatch.bestScore", { score: highScore })}
          </p>
        )}
        <div className="flex flex-col gap-sm w-full max-w-xs">
          <Button onClick={() => start("easy")}>{t("games.morseMatch.difficulty.easy")}</Button>
          <Button onClick={() => start("hard")}>{t("games.morseMatch.difficulty.hard")}</Button>
        </div>
        <Button variant="secondary" onClick={onExit}>
          {t("common.back")}
        </Button>
      </Card>
    );
  }

  if (phase === "over") {
    return (
      <Card className="p-lg flex flex-col items-center text-center gap-lg">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("games.morseMatch.youWon")}
        </h3>
        {isNewHigh && (
          <p className="text-primary text-sm font-semibold flex items-center gap-xs animate-combo-pop">
            <Icon name="crown" className="w-4 h-4" /> {t("games.newHighScore")}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg w-full max-w-md">
          <GameStat label={t("games.score")} value={score} highlight />
          <GameStat label={t("games.morseMatch.flips", { count: flipCount })} value={flipCount} />
          <GameStat label={t("games.efficiency")} value={`${efficiency}%`} />
          <GameStat label={t("games.bestCombo")} value={`${bestCombo}\u00d7`} />
        </div>
        <div className="flex gap-md">
          <Button variant="secondary" onClick={onExit}>
            {t("common.back")}
          </Button>
          <Button onClick={() => start(difficulty)} icon={<Icon name="refresh" className="w-4 h-4" />}>
            {t("practice.speed.playAgain")}
          </Button>
        </div>
      </Card>
    );
  }

  const cols = grid === "4x4" ? "grid-cols-4" : "grid-cols-6";

  return (
    <Card className="p-lg flex flex-col gap-md relative">
      <div className="flex justify-between items-center text-sm">
        <span className="text-on-surface-variant">
          {t("games.morseMatch.pairsFound", { count: pairsFound, total: totalPairs })}
        </span>
        <ComboBadge combo={combo} />
        <span className="text-on-surface-variant">
          {t("games.morseMatch.flips", { count: flipCount })}
        </span>
      </div>

      <div className={cn("grid gap-2", cols)}>
        {cards.map((card) => (
          <div key={card.id} className="flip-card aspect-square relative">
            <button
              onClick={() => handleFlip(card.id)}
              className={cn(
                "flip-card-inner w-full h-full",
                (card.flipped || card.matched) && "is-flipped",
                card.justMatched && "animate-match-pulse"
              )}
              disabled={card.matched}
            >
              <div className="flip-card-face rounded-xl border-2 border-outline-variant bg-surface-container-high text-on-surface-variant hover:border-primary/50 hover:bg-surface-container transition-colors text-lg">
                ?
              </div>
              <div
                className={cn(
                  "flip-card-face flip-card-back rounded-xl border-2 text-sm font-bold",
                  card.matched ? "border-primary bg-primary/10 text-primary" : "border-primary bg-surface-container text-on-surface",
                  card.type === "code" && "font-mono tracking-widest"
                )}
              >
                {card.display}
              </div>
            </button>
            {card.justMatched && (
              <div className="absolute inset-0 pointer-events-none">
                <ParticleBurst burstId={burstId} color="var(--color-primary)" count={8} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
