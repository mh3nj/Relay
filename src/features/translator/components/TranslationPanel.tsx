import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface TranslationPanelProps {
  plainText: string;
  morse: string;
  onPlainTextChange: (value: string) => void;
  onMorseChange: (value: string) => void;
  onSwap: () => void;
  onClear: () => void;
}

function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const copy = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (insecure context, permissions,
      // older browsers). Fail quietly rather than leaving an unhandled
      // rejection and no feedback at all.
    }
  };
  return { copied, copy };
}

export function TranslationPanel({
  plainText,
  morse,
  onPlainTextChange,
  onMorseChange,
  onSwap,
  onClear,
}: TranslationPanelProps) {
  const { t } = useTranslation();
  const textCopy = useCopyFeedback();
  const morseCopy = useCopyFeedback();

  return (
    <Card className="overflow-hidden flex flex-col lg:flex-row min-h-[360px]">
      {/* Plain text side */}
      <div className="flex-1 flex flex-col p-lg relative group">
        <div className="flex justify-between items-center mb-md">
          <label
            htmlFor="text-input"
            className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
          >
            {t("translator.plainText")}
          </label>
          {plainText && (
            <button
              onClick={onClear}
              title={t("common.clear") ?? ""}
              aria-label={t("common.clearTranslation") ?? "Clear translation"}
              className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
              <Icon name="close" className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
        <textarea
          id="text-input"
          value={plainText}
          onChange={(e) => onPlainTextChange(e.target.value)}
          placeholder={t("translator.textPlaceholder") ?? ""}
          className="flex-1 bg-transparent border-none resize-none text-on-surface text-body-md focus:ring-0 focus:outline-none p-0 placeholder:text-outline min-h-[120px]"
        />
        <div className="mt-md flex justify-between items-center border-t border-outline-variant/30 pt-md">
          <span className="font-label-sm text-label-sm text-outline">
            {t("common.characters", { count: plainText.length })}
          </span>
          <button
            onClick={() => textCopy.copy(plainText)}
            className="flex items-center gap-xs text-primary font-label-sm text-label-sm hover:text-primary-fixed-dim transition-colors"
          >
            {textCopy.copied ? (
              <Icon name="check" className="w-4 h-4" />
            ) : (
              <Icon name="copy" className="w-4 h-4" />
            )}
            {textCopy.copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
      </div>

      {/* Swap control */}
      <div className="flex lg:flex-col items-center justify-center p-md bg-surface border-y lg:border-y-0 lg:border-x border-outline-variant/30 relative z-10">
        <button
          onClick={onSwap}
          aria-label={t("translator.swapDirection") ?? ""}
          className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary hover:bg-primary/10 hover:border-primary transition-all"
        >
          <Icon name="swap" className="w-5 h-5 rotate-90 lg:rotate-0" />
        </button>
      </div>

      {/* Morse side */}
      <div className="flex-1 flex flex-col p-lg bg-surface-container relative group">
        <div className="flex justify-between items-center mb-md">
          <label
            htmlFor="morse-output"
            className="font-label-sm text-label-sm text-primary uppercase tracking-wider flex items-center gap-xs"
          >
            <span
              className={cn("w-2 h-2 rounded-full bg-primary inline-block", morse && "animate-pulse")}
            />
            {t("translator.morseCode")}
          </label>
          <button
            onClick={() => morseCopy.copy(morse)}
            title={t("common.copy") ?? ""}
            className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            {morseCopy.copied ? (
              <Icon name="check" className="w-[18px] h-[18px]" />
            ) : (
              <Icon name="copy" className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>
        <textarea
          id="morse-output"
          value={morse}
          onChange={(e) => onMorseChange(e.target.value)}
          placeholder={t("translator.morsePlaceholder") ?? ""}
          className="flex-1 bg-transparent border-none resize-none text-primary font-mono text-morse-code focus:ring-0 focus:outline-none p-0 placeholder:text-outline/50 leading-relaxed tracking-[0.2em] min-h-[120px]"
        />
      </div>
    </Card>
  );
}
