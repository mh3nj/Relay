import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { ABBREVIATIONS } from "@/lib/encyclopediaData";

export function AbbreviationsSidebar() {
  const { t } = useTranslation();
  return (
    <Card className="p-lg">
      <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
        {t("encyclopedia.abbreviationsTitle")}
      </h3>
      <div className="grid grid-cols-2 gap-sm">
        {ABBREVIATIONS.map((a) => (
          <div key={a.abbr} className="flex flex-col">
            <span className="font-bold text-primary text-sm">{a.abbr}</span>
            <span className="text-label-sm text-on-surface-variant">{a.meaning}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function HistorySidebar() {
  const { t } = useTranslation();
  return (
    <Card className="p-lg">
      <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
        {t("encyclopedia.historyTitle")}
      </h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {t("encyclopedia.historyText")}
      </p>
    </Card>
  );
}
