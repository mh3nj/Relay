import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { CHAR_TO_IMAGE, LIGHT_CHAR_TO_IMAGE } from "@/lib/charImages";

interface CharacterHeroProps {
  char: string;
  code: string;
}

const DARK_THEMES = new Set(["dark", "midnight", "ocean", "forest", "coffee"]);

export function CharacterHero({ char, code }: CharacterHeroProps) {
  const { t } = useTranslation();
  const { theme } = useThemeSettings();
  const [errored, setErrored] = useState(false);
  const isDark = DARK_THEMES.has(theme);
  const map = isDark ? CHAR_TO_IMAGE : LIGHT_CHAR_TO_IMAGE;
  const imgId = map[char];
  const imgSrc = imgId ? `/map/${isDark ? "dark" : "light"}-${imgId}.png` : null;

  const symbols = code.split("");

  return (
    <div className="lg:col-span-4 bg-surface-container border border-outline-variant/30 rounded-xl p-lg flex flex-col relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
        {t("learn.character")}
      </span>

      <div className="flex-1 flex flex-col items-center justify-center gap-sm -mt-lg">
        {imgSrc && !errored ? (
          <img
            src={imgSrc}
            alt={char}
            loading="lazy"
            className="max-h-[180px] w-auto object-contain rounded-xl"
            onError={() => setErrored(true)}
          />
        ) : (
          <h2 className="font-display-lg text-[clamp(64px,20vw,120px)] leading-none text-on-surface font-black tracking-tighter">
            {char}
          </h2>
        )}

        {code && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 w-full max-w-xs">
            {symbols.map((symbol, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5"
              >
                <span className="text-[0.625rem] font-label-sm text-on-surface-variant/60 leading-none">
                  {i + 1}
                </span>
                <div
                  className={`rounded-full border-2 border-primary/40 flex items-center justify-center ${
                    symbol === "-"
                      ? "w-8 h-2.5 rounded-sm bg-primary/30"
                      : "w-2.5 h-2.5 bg-primary/30"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-md bg-surface-container-high px-xl py-sm rounded-full border border-outline-variant/50">
          <span className="font-morse-code text-morse-code text-primary">{code}</span>
        </div>
      </div>
    </div>
  );
}
