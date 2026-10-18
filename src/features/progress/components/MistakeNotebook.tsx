import { useMemo } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CHAR_TO_MORSE } from "@/lib/morse";
import type { ConfusionPairDisplay } from "@/lib/mastery";

interface MistakeNotebookProps {
  pairs: ConfusionPairDisplay[];
  className?: string;
  style?: CSSProperties;
}

export function MistakeNotebook({ pairs, className, style }: MistakeNotebookProps) {
  const { t } = useTranslation();

  // Deep-links into Practice's focused-filter mode with every character
  // that appears in a real confusion pair, so "Focused Practice" drills
  // exactly what's shown here rather than the full learned pool.
  const focusHref = useMemo(() => {
    if (pairs.length === 0) return "/practice";
    const chars = Array.from(new Set(pairs.flatMap((p) => [p.a, p.b])));
    return `/practice?chars=${chars.join(",")}`;
  }, [pairs]);

  return (
    <Card className={cn("md:col-span-6 p-lg flex flex-col", className)} style={style}>
      <div className="flex items-center gap-sm mb-md">
        <Icon name="brain" className="w-5 h-5 text-tertiary" />
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("progress.confusingPairs")}
        </h3>
      </div>

      <div className="flex-grow space-y-sm mb-lg">
        {pairs.length === 0 ? (
          <p className="text-sm text-on-surface-variant">{t("progress.noMixups")}</p>
        ) : (
          pairs.map((pair) => (
            <div
              key={`${pair.a}-${pair.b}`}
              className="p-sm bg-surface-bright rounded border border-outline-variant/40 flex justify-between items-center"
            >
              <div className="flex items-center gap-md font-morse-code text-sm">
                <span className="text-error">
                  {pair.a} <span className="text-[0.6875rem] opacity-70">{CHAR_TO_MORSE[pair.a]}</span>
                </span>
                <span className="text-on-surface-variant text-[0.625rem]">{t("progress.vs")}</span>
                <span className="text-error">
                  {pair.b} <span className="text-[0.6875rem] opacity-70">{CHAR_TO_MORSE[pair.b]}</span>
                </span>
              </div>
              <span className="text-[0.625rem] text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                {t(pair.count === 1 ? "progress.mixupCount" : "progress.mixupCount_other", {
                  count: pair.count,
                })}
              </span>
            </div>
          ))
        )}
      </div>

      <Link to={focusHref}>
        <Button className="w-full" icon={<Icon name="play" className="w-4 h-4" />}>
          {t("progress.focusedPractice")}
        </Button>
      </Link>
    </Card>
  );
}
