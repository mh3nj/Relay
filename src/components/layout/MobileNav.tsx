import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLogo } from "@/components/ui/AppLogo";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "@/app/nav-items";
import { cn } from "@/lib/utils";

// Mobile shows the 5 most-used sections in the bottom bar; the rest live under "More" via Settings.
const MOBILE_PRIMARY = NAV_ITEMS.slice(0, 5);

export function MobileTopBar() {
  const { t } = useTranslation();
  return (
    <div className="md:hidden flex items-center gap-sm p-md bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/30">
      <AppLogo className="w-8 h-8" />
      <h1 className="text-heading-md font-heading-md text-on-surface m-0 text-lg">
        {t("app.name")}
      </h1>
    </div>
  );
}

export function MobileBottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("common.primaryNavigation") ?? "Primary"}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline-variant/30 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-between px-xs">
        {MOBILE_PRIMARY.map((item) => (
          <li key={item.path} className="flex-1">
            <NavLink
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2 transition-colors",
                  isActive ? "text-primary" : "text-on-surface-variant"
                )
              }
            >
              <Icon name={item.icon} className="w-5 h-5" />
              <span className="text-[0.625rem] font-label-sm leading-none">{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
