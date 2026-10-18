import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LanguageSection } from "@/features/settings/components/LanguageSection";
import { BackupSection } from "@/features/settings/components/BackupSection";
import { AiAssistantSection } from "@/features/settings/components/AiAssistantSection";
import { AppearanceSection } from "@/features/settings/components/AppearanceSection";
import { AudioTimingSection } from "@/features/settings/components/AudioTimingSection";
import { AccessibilitySection } from "@/features/settings/components/AccessibilitySection";
import { KeyboardShortcutsSection } from "@/features/settings/components/KeyboardShortcutsSection";

const SECTIONS = [
  AppearanceSection,
  AudioTimingSection,
  AccessibilitySection,
  KeyboardShortcutsSection,
  LanguageSection,
  BackupSection,
  AiAssistantSection,
];

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t("settings.title")} description={t("settings.description") ?? undefined} />

      <div className="flex flex-col gap-lg max-w-2xl w-full">
        {SECTIONS.map((Section, i) => (
          <div key={Section.name} className="reveal-item" style={{ "--reveal-delay": `${i * 40}ms` } as CSSProperties}>
            <Section />
          </div>
        ))}
      </div>
    </>
  );
}
