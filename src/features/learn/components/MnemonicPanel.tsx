import { useTranslation } from "react-i18next";
import type { Mnemonic } from "@/lib/mnemonics";

interface MnemonicPanelProps {
  char: string;
  mnemonic: Mnemonic;
}

export function MnemonicPanel({ char, mnemonic }: MnemonicPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-lg flex flex-col gap-md">
      <div>
        <h3 className="font-heading-md text-heading-md text-on-surface mb-xs">
          {t("learn.mnemonic")}
        </h3>
        <div className="bg-surface p-md rounded-lg border border-outline-variant/50">
          <p className="font-body-md text-body-md text-on-surface italic">"{mnemonic.hint}"</p>
        </div>
      </div>
      {mnemonic.examples.length > 0 && (
        <div className="mt-auto">
          <h4 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-sm">
            {t("learn.examples")}
          </h4>
          <div className="flex flex-wrap gap-sm">
            {mnemonic.examples.map((word) => {
              const startsWithChar = word[0]?.toUpperCase() === char.toUpperCase();
              return (
                <span
                  key={word}
                  className="px-md py-xs rounded-full bg-surface-bright border border-outline-variant text-on-surface text-body-md"
                >
                  {startsWithChar ? (
                    <>
                      <strong className="text-primary">{word[0]}</strong>
                      {word.slice(1)}
                    </>
                  ) : (
                    word
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
