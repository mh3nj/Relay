import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface ComingSoonProps {
  icon: IconName;
  title: string;
  note: string;
}

/** Placeholder for features not yet built in this sprint, so navigation
 * is fully wired up and every route renders something intentional. */
export function ComingSoon({ icon, title, note }: ComingSoonProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-md py-3xl">
      <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
        <Icon name={icon} className="w-7 h-7 text-on-surface-variant" />
      </div>
      <h3 className="text-heading-md text-on-surface">{t("common.comingSoon", { feature: title })}</h3>
      <p className="text-body-md text-on-surface-variant max-w-sm">{note}</p>
    </div>
  );
}
