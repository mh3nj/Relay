import { useTranslation } from "react-i18next";

interface LessonProgressBarProps {
  index: number;
  total: number;
}

export function LessonProgressBar({ index, total }: LessonProgressBarProps) {
  const { t } = useTranslation();
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0;
  return (
    <div className="w-full flex items-center gap-md">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest shrink-0">
        {t("learn.progress")}
      </span>
      <div
        className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-label-sm text-label-sm text-primary shrink-0">
        {index + 1} / {total}
      </span>
    </div>
  );
}
