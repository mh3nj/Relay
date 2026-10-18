import { useState } from "react";
import { useThemeSettings } from "@/hooks/useThemeSettings";

const DARK_THEMES = new Set(["dark", "midnight", "ocean", "forest", "coffee"]);

export function AppLogo({ className = "w-10 h-10" }: { className?: string }) {
  const { theme } = useThemeSettings();
  const [errored, setErrored] = useState(false);
  const src = DARK_THEMES.has(theme) ? "/icons/Relay-1.png" : "/icons/Relay-2.png";

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0`}
      aria-label="Relay logo"
    >
      {errored ? (
        <span className="font-bold text-white text-lg">R</span>
      ) : (
        <img
          src={src}
          alt="Relay"
          className="w-full h-full object-contain"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
