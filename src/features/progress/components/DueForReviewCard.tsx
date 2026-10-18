import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";

interface DueForReviewCardProps {
  chars: string[];
  className?: string;
  style?: CSSProperties;
}

export function DueForReviewCard({ chars, className, style }: DueForReviewCardProps) {
  const { t } = useTranslation();
  const focusHref = chars.length > 0 ? `/practice?chars=${chars.join(",")}` : "/practice";

  return (
    <Card className={cn("md:col-span-6 p-lg flex flex-col", className)} style={style}>
      <div className="flex items-center gap-sm mb-md">
        <Icon name="clock" className="w-5 h-5 text-tertiary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("progress.dueForReview")}
        </h3>
      </div>

      {chars.length === 0 ? (
        <p className="text-sm text-on-surface-variant flex-grow">
          {t("progress.dueForReviewEmpty")}
        </p>
      ) : (
        <div className="flex gap-sm flex-wrap flex-grow content-start mb-md">
          {chars.map((char) => (
            <div
              key={char}
              className="w-12 h-12 bg-waveform-well rounded-lg border border-tertiary/30 flex flex-col items-center justify-center"
            >
              <span className="text-sm text-on-background font-bold leading-none mb-1">
                {char}
              </span>
              <span className="font-morse-code text-[0.625rem] text-tertiary leading-none">
                {CHAR_TO_MORSE[char]}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link to={focusHref}>
        <Button
          className="w-full"
          variant={chars.length > 0 ? "primary" : "outline"}
          disabled={chars.length === 0}
          icon={<Icon name="play" className="w-4 h-4" />}
        >
          {t("progress.reviewNow")}
        </Button>
      </Link>
    </Card>
  );
}
