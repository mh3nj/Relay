import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";

interface ShortcutRow {
  contextKey: string;
  actionKey: string;
  keyKey: string;
}

// Kept in sync by hand with the actual bindings in TransmissionPractice
// (Learn) and MorseInvaders (Games). This is a reference, not a
// separate source of truth, so it can't drift into fiction.
const SHORTCUTS: ShortcutRow[] = [
  { contextKey: "nav.learn", actionKey: "settings.shortcuts.learnTransmit", keyKey: "settings.shortcuts.spaceKey" },
  {
    contextKey: "games.morseInvaders.title",
    actionKey: "settings.shortcuts.morseInvadersDot",
    keyKey: "settings.shortcuts.dotKey",
  },
  {
    contextKey: "games.morseInvaders.title",
    actionKey: "settings.shortcuts.morseInvadersDash",
    keyKey: "settings.shortcuts.dashKey",
  },
];

export function KeyboardShortcutsSection() {
  const { t } = useTranslation();

  return (
    <Card className="p-lg">
      <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
        {t("settings.shortcuts.title")}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-label-sm text-on-surface-variant uppercase tracking-wider">
            <th className="pb-sm font-normal">{t("settings.shortcuts.context")}</th>
            <th className="pb-sm font-normal">{t("settings.shortcuts.action")}</th>
            <th className="pb-sm font-normal text-right">{t("settings.shortcuts.key")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {SHORTCUTS.map((row, i) => (
            <tr key={i}>
              <td className="py-sm text-on-surface-variant">{t(row.contextKey)}</td>
              <td className="py-sm text-on-surface">{t(row.actionKey)}</td>
              <td className="py-sm text-right">
                <kbd className="px-2 py-1 bg-surface-bright rounded font-mono text-xs text-on-surface">
                  {t(row.keyKey)}
                </kbd>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
