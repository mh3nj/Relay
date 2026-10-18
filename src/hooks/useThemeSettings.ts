import { useCallback, useEffect, useState } from "react";
import { getTheme, setTheme as persistTheme } from "@/lib/settingsStore";
import type { ThemeName } from "@/lib/settingsStore";

export function useThemeSettings() {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTheme().then((stored) => {
      if (cancelled) return;
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    void persistTheme(next);
  }, []);

  return { theme, setTheme, loaded };
}
