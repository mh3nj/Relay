import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import {
  getAiSettings,
  saveAiSettings,
  DEFAULT_AI_SETTINGS,
  MAX_TOKENS_CEILING,
  MAX_TOKENS_FLOOR,
  DAILY_LIMIT_CEILING,
  DAILY_LIMIT_FLOOR,
} from "@/lib/aiSettings";
import type { AiSettings, AiProvider } from "@/lib/aiSettings";

const PROVIDERS: { value: AiProvider; labelKey: string }[] = [
  { value: "openai", labelKey: "settings.ai.providerOpenAI" },
  { value: "anthropic", labelKey: "settings.ai.providerAnthropic" },
  { value: "custom", labelKey: "settings.ai.providerCustom" },
];

export function AiAssistantSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    void getAiSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const persist = async (next: AiSettings) => {
    setSettings(next);
    await saveAiSettings(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  if (!loaded) return null;

  return (
    <Card className="p-lg flex flex-col gap-lg">
      <div>
        <CardEyebrow>{t("settings.sections.aiAssistant")}</CardEyebrow>
        <p className="text-body-md text-on-surface-variant mt-xs">{t("settings.ai.description")}</p>
      </div>

      {/* Cost warning. Always visible, never tucked away */}
      <div className="flex items-start gap-sm p-md rounded-lg bg-tertiary-container/10 border border-tertiary/30">
        <Icon name="warning" className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
        <p className="text-label-sm text-on-surface">{t("settings.ai.costWarning")}</p>
      </div>

      <label className="flex items-center justify-between gap-md cursor-pointer">
        <span className="text-sm font-medium text-on-surface">{t("settings.ai.enable")}</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => void persist({ ...settings, enabled: e.target.checked })}
          className="w-5 h-5 accent-primary"
        />
      </label>

      <div className="space-y-xs">
        <label htmlFor="ai-provider" className="text-label-sm text-on-surface-variant">
          {t("settings.ai.provider")}
        </label>
        <select
          id="ai-provider"
          value={settings.provider}
          onChange={(e) => void persist({ ...settings, provider: e.target.value as AiProvider })}
          className="w-full bg-surface border border-outline-variant/50 rounded-lg px-sm py-2 text-sm text-on-surface"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {t(p.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {settings.provider === "custom" && (
        <div className="space-y-xs">
          <label htmlFor="ai-endpoint" className="text-label-sm text-on-surface-variant">
            {t("settings.ai.endpointUrl")}
          </label>
          <input
            id="ai-endpoint"
            type="url"
            value={settings.customEndpoint ?? ""}
            placeholder={t("settings.ai.endpointPlaceholder")}
            onChange={(e) => void persist({ ...settings, customEndpoint: e.target.value })}
            className="w-full bg-surface border border-outline-variant/50 rounded-lg px-sm py-2 text-sm text-on-surface"
          />
        </div>
      )}

      <div className="space-y-xs">
        <label htmlFor="ai-key" className="text-label-sm text-on-surface-variant">
          {t("settings.ai.apiKey")}
        </label>
        <div className="flex gap-xs">
          <input
            id="ai-key"
            type={showKey ? "text" : "password"}
            value={settings.apiKey}
            placeholder={t("settings.ai.apiKeyPlaceholder") ?? undefined}
            autoComplete="off"
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            onBlur={() => void persist(settings)}
            className="flex-1 bg-surface border border-outline-variant/50 rounded-lg px-sm py-2 text-sm text-on-surface font-mono"
          />
          <Button
            variant="icon"
            aria-label={showKey ? t("settings.ai.hideKey") ?? undefined : t("settings.ai.showKey") ?? undefined}
            onClick={() => setShowKey((s) => !s)}
          >
            <Icon name={showKey ? "eyeOff" : "eye"} className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-label-sm text-on-surface-variant">{t("settings.ai.apiKeyHelp")}</p>
        {settings.apiKey && (
          <button
            onClick={() => void persist({ ...settings, apiKey: "" })}
            className="text-label-sm text-error hover:underline"
          >
            {t("settings.ai.clearKey")}
          </button>
        )}
      </div>

      {/* Hard-capped sliders: costs are bounded no matter what the user sets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <div className="space-y-xs">
          <div className="flex justify-between text-label-sm text-on-surface-variant">
            <label htmlFor="ai-max-tokens">{t("settings.ai.maxTokens")}</label>
            <span>{settings.maxTokens}</span>
          </div>
          <input
            id="ai-max-tokens"
            type="range"
            min={MAX_TOKENS_FLOOR}
            max={MAX_TOKENS_CEILING}
            step={50}
            value={settings.maxTokens}
            onChange={(e) => setSettings({ ...settings, maxTokens: Number(e.target.value) })}
            onMouseUp={() => void persist(settings)}
            onTouchEnd={() => void persist(settings)}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-xs">
          <div className="flex justify-between text-label-sm text-on-surface-variant">
            <label htmlFor="ai-daily-limit">{t("settings.ai.dailyLimit")}</label>
            <span>{settings.dailyMessageLimit}</span>
          </div>
          <input
            id="ai-daily-limit"
            type="range"
            min={DAILY_LIMIT_FLOOR}
            max={DAILY_LIMIT_CEILING}
            step={5}
            value={settings.dailyMessageLimit}
            onChange={(e) => setSettings({ ...settings, dailyMessageLimit: Number(e.target.value) })}
            onMouseUp={() => void persist(settings)}
            onTouchEnd={() => void persist(settings)}
            className="w-full accent-primary"
          />
          <p className="text-label-sm text-on-surface-variant">{t("settings.ai.dailyLimitHelp")}</p>
        </div>
      </div>

      <p className={cn("text-label-sm text-primary transition-opacity", savedFlash ? "opacity-100" : "opacity-0")}>
        {t("common.success")}
      </p>
    </Card>
  );
}
