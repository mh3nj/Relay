import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface GameCardProps {
  icon: IconName;
  title: string;
  description: string;
  highScore: number;
  onPlay: () => void;
}

export function GameCard({ icon, title, description, highScore, onPlay }: GameCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="p-lg flex flex-col gap-md hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary">
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-heading-md text-lg font-semibold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-1">{description}</p>
      </div>
      <div className="mt-auto pt-md flex items-center justify-between border-t border-outline-variant/30">
        <span className="text-label-sm text-on-surface-variant">
          {highScore > 0 ? t("games.best", { score: highScore }) : t("games.notPlayedYet")}
        </span>
        <Button size="sm" onClick={onPlay} icon={<Icon name="play" className="w-4 h-4" />}>
          {t("games.play")}
        </Button>
      </div>
    </Card>
  );
}
