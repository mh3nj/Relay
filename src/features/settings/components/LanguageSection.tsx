import { useTranslation } from "react-i18next";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSection() {
  const { t, i18n } = useTranslation();

  return (
    <Card className="p-lg flex flex-col gap-md">
      <div>
        <CardEyebrow>{t("settings.sections.language")}</CardEyebrow>
        <p className="text-body-md text-on-surface-variant mt-xs">
          {t("settings.language.description")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = i18n.language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => void i18n.changeLanguage(lang.code)}
              className={cn(
                "flex flex-col items-start gap-1 px-md py-sm rounded-lg border text-left transition-colors",
                active
                  ? "border-primary bg-primary/10 text-on-surface"
                  : "border-outline-variant/40 text-on-surface-variant hover:bg-surface-bright"
              )}
            >
              <span className="flex items-center gap-xs text-sm font-medium">
                {lang.nativeLabel}
                {active && <Icon name="check" className="w-3.5 h-3.5 text-primary" />}
              </span>
              <span className="flex items-center gap-xs text-label-sm text-on-surface-variant">
                {lang.label}
                {lang.isPlaceholder && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[0.625rem] uppercase tracking-wide">
                    {t("settings.language.placeholderBadge")}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
