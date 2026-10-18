import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WpmChart } from "@/components/charts/WpmChart";
import { WelcomeHero, DailyChallengeCard } from "@/features/dashboard/components/HeroCards";
import {
  MasteryCard,
  WeakSymbolsCard,
  BadgesCard,
} from "@/features/dashboard/components/StatsCards";
import { useDashboardStats } from "@/hooks/useDashboardStats";

/** Staggered entrance delay for the Nth dashboard card. */
function revealStyle(index: number): CSSProperties {
  return { "--reveal-delay": `${index * 60}ms` } as CSSProperties;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const stats = useDashboardStats();

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        action={
          <Link to="/learn">
            <Button icon={<Icon name="play" className="w-5 h-5" />}>
              {t("dashboard.startLearning")}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <WelcomeHero
          streakDays={stats.streakDays}
          currentChar={stats.currentLessonChar}
          currentCode={stats.currentLessonCode}
          xpProgress={stats.xpProgress}
          className="reveal-item"
          style={revealStyle(0)}
        />
        <DailyChallengeCard
          target={stats.dailyChallenge.target}
          done={stats.dailyChallenge.done}
          total={stats.dailyChallenge.total}
          className="reveal-item"
          style={revealStyle(1)}
        />

        <MasteryCard percent={stats.overallMasteryPct} className="reveal-item" style={revealStyle(2)} />
        <WeakSymbolsCard symbols={stats.weakSymbols} className="reveal-item" style={revealStyle(3)} />
        <BadgesCard badges={stats.badges} className="reveal-item" style={revealStyle(4)} />

        <Card
          className="md:col-span-12 p-lg md:p-xl flex flex-col h-[300px] reveal-item"
          style={revealStyle(5)}
        >
          <WpmChart datasets={stats.wpmHistoryByRange} />
        </Card>
      </div>
    </>
  );
}
