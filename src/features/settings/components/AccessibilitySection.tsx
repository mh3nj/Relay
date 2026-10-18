import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useAccessibilitySettings } from "@/hooks/useAccessibilitySettings";
import type { TextSize } from "@/lib/settingsStore";

const TEXT_SIZES: TextSize[] = ["small", "default", "large"];

export function AccessibilitySection() {
  const { t } = useTranslation();
  const { settings, update, loaded } = useAccessibilitySettings();

  if (!loaded) return null;

  return (
    <Card className="p-lg flex flex-col gap-lg">
      <h3 className="font-heading-md text-heading-md text-on-surface">
        {t("settings.sections.accessibility")}
      </h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-md text-on-surface">{t("settings.accessibility.highContrast")}</p>
          <p className="text-[0.6875rem] text-on-surface-variant mt-1">
            {t("settings.accessibility.highContrastHelp")}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.highContrast}
          onClick={() => update({ ...settings, highContrast: !settings.highContrast })}
          className={cn(
            "w-12 h-7 rounded-full transition-colors relative shrink-0",
            settings.highContrast ? "bg-primary" : "bg-surface-bright"
          )}
        >
          <span
            className={cn(
              "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
              settings.highContrast ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div>
        <p className="text-body-md text-on-surface mb-sm">{t("settings.accessibility.textSize")}</p>
        <div className="flex gap-sm">
          {TEXT_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => update({ ...settings, textSize: size })}
              aria-pressed={settings.textSize === size}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm transition-colors",
                settings.textSize === size
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant/40 text-on-surface-variant hover:border-primary/50"
              )}
            >
              {t(`settings.accessibility.textSizes.${size}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-body-md text-on-surface mb-sm">{t("settings.accessibility.reducedMotion")}</p>
        <div className="flex gap-sm">
          <button
            onClick={() => update({ ...settings, reducedMotionOverride: null })}
            aria-pressed={settings.reducedMotionOverride === null}
            className={cn(
              "flex-1 py-2 rounded-lg border text-sm transition-colors",
              settings.reducedMotionOverride === null
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant/40 text-on-surface-variant hover:border-primary/50"
            )}
          >
            {t("settings.accessibility.reducedMotionAuto")}
          </button>
          <button
            onClick={() => update({ ...settings, reducedMotionOverride: true })}
            aria-pressed={settings.reducedMotionOverride === true}
            className={cn(
              "flex-1 py-2 rounded-lg border text-sm transition-colors",
              settings.reducedMotionOverride === true
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant/40 text-on-surface-variant hover:border-primary/50"
            )}
          >
            {t("settings.accessibility.reducedMotionOn")}
          </button>
          <button
            onClick={() => update({ ...settings, reducedMotionOverride: false })}
            aria-pressed={settings.reducedMotionOverride === false}
            className={cn(
              "flex-1 py-2 rounded-lg border text-sm transition-colors",
              settings.reducedMotionOverride === false
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant/40 text-on-surface-variant hover:border-primary/50"
            )}
          >
            {t("settings.accessibility.reducedMotionOff")}
          </button>
        </div>
      </div>
    </Card>
  );
}
