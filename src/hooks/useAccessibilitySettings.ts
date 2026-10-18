import { useCallback, useEffect, useState } from "react";
import {
  getAccessibilitySettings,
  setAccessibilitySettings as persistAccessibility,
  DEFAULT_ACCESSIBILITY_SETTINGS,
} from "@/lib/settingsStore";
import type { AccessibilitySettings } from "@/lib/settingsStore";

function applyToDocument(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.setAttribute("data-high-contrast", String(settings.highContrast));
  root.setAttribute("data-text-size", settings.textSize);

  if (settings.reducedMotionOverride === null) {
    root.removeAttribute("data-reduced-motion");
  } else {
    root.setAttribute("data-reduced-motion", String(settings.reducedMotionOverride));
  }
}

export function useAccessibilitySettings() {
  const [settings, setSettingsState] = useState<AccessibilitySettings>(
    DEFAULT_ACCESSIBILITY_SETTINGS
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAccessibilitySettings().then((stored) => {
      if (cancelled) return;
      setSettingsState(stored);
      applyToDocument(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((next: AccessibilitySettings) => {
    setSettingsState(next);
    applyToDocument(next);
    void persistAccessibility(next);
  }, []);

  return { settings, update, loaded };
}
