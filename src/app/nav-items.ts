import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  /** i18next key under "nav.*" */
  labelKey: string;
  path: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/", icon: "dashboard" },
  { labelKey: "nav.learn", path: "/learn", icon: "learn" },
  { labelKey: "nav.practice", path: "/practice", icon: "practice" },
  { labelKey: "nav.translator", path: "/translator", icon: "translator" },
  { labelKey: "nav.games", path: "/games", icon: "games" },
  { labelKey: "nav.progress", path: "/progress", icon: "progress" },
  { labelKey: "nav.encyclopedia", path: "/encyclopedia", icon: "encyclopedia" },
  { labelKey: "nav.settings", path: "/settings", icon: "settings" },
];
