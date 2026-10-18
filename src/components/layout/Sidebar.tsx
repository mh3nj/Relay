import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLogo } from "@/components/ui/AppLogo";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "@/app/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("common.mainNavigation") ?? "Main navigation"}
      className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] flex-col py-lg px-md z-50 bg-surface border-r border-outline-variant/30 shadow-sm"
    >
      <div className="flex items-center gap-md mb-2xl px-sm">
        <AppLogo className="w-10 h-10" />
        <div>
          <h1 className="text-heading-md font-heading-md text-on-surface leading-none m-0">
            {t("app.name")}
          </h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs">
            {t("app.tagline")}
          </p>
        </div>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-sm flex-grow overflow-y-auto pr-xs">
        {NAV_ITEMS.map((item) => {
          const isLast = item.path === "/settings";
          return (
            <li key={item.path} className={isLast ? "mt-auto" : undefined}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-md px-sm py-3 rounded-lg border-l-4 transition-colors duration-200",
                    "active:scale-[0.98]",
                    isActive
                      ? "text-primary font-bold border-primary bg-surface-bright/50"
                      : "text-on-surface-variant border-transparent hover:bg-surface-bright"
                  )
                }
              >
                <Icon name={item.icon} className="w-5 h-5" />
                <span className="text-body-md font-body-md">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Footer CTA. No paywall here; this one links to "About" instead */}
      <div className="mt-xl">
        <NavLink
          to="/settings"
          className="w-full py-3 px-md rounded-lg bg-primary-container text-on-primary-container font-body-md text-body-md font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-sm"
        >
          <Icon name="crown" className="w-5 h-5" />
          {t("nav.freeForever")}
        </NavLink>
      </div>
    </nav>
  );
}
