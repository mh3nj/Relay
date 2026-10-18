import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import type { ThemeName } from "@/lib/settingsStore";

const THEME_SWATCHES: Record<ThemeName, [string, string]> = {
  dark: ["#13131b", "#c0c1ff"],
  light: ["#fbfaff", "#494bd6"],
  midnight: ["#0a0e1a", "#8ab4ff"],
  ocean: ["#0d1b1e", "#4dd0e1"],
  forest: ["#0e1712", "#7cd992"],
  coffee: ["#1a1410", "#d9a066"],
  frost: ["#eef4fa", "#3a76b0"],
  sunrise: ["#fff8f0", "#e8703a"],
};

const THEME_ORDER: ThemeName[] = [
  "dark",
  "light",
  "midnight",
  "ocean",
  "forest",
  "coffee",
  "frost",
  "sunrise",
];

export function AppearanceSection() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeSettings();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  return (
    <Card className="p-lg flex flex-col gap-lg">
      <div>
        <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
          {t("settings.sections.appearance")}
        </h3>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">
          {t("settings.appearance.themeLabel")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
          {THEME_ORDER.map((name) => {
            const [bg, accent] = THEME_SWATCHES[name];
            const active = theme === name;
            return (
              <button
                key={name}
                onClick={() => setTheme(name)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-sm p-sm rounded-lg border transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-outline-variant/40 hover:border-primary/50"
                )}
              >
                <span
                  className="w-8 h-8 rounded-full border border-outline-variant/40 shrink-0 relative overflow-hidden"
                  style={{ background: bg }}
                >
                  <span
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full"
                    style={{ background: accent }}
                  />
                </span>
                <span className="text-sm text-on-surface truncate">
                  {t(`settings.appearance.themes.${name}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-lg border-t border-outline-variant/30">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <Icon name="download" className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-body-md text-on-surface font-medium">
              {t("settings.appearance.installTitle")}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-1">
              {isInstalled
                ? t("settings.appearance.installed")
                : canInstall
                  ? t("settings.appearance.installDescription")
                  : t("settings.appearance.installUnsupported")}
            </p>
          </div>
          {canInstall && (
            <Button size="sm" onClick={() => void promptInstall()}>
              {t("settings.appearance.install")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
