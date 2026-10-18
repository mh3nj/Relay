import i18n from "@/i18n";

/**
 * Mnemonic hints and example words for each character, shared by the
 * Learn lessons and the Encyclopedia. The actual text lives in
 * i18n/locales/en.json under "mnemonics" (examples pipe-separated) so
 * every string here is translatable, not hardcoded. This is
 * plain data-access code rather than a component, so it reads the
 * i18next instance directly instead of the useTranslation hook.
 */
export interface Mnemonic {
  hint: string;
  examples: string[];
}

export function getMnemonic(char: string): Mnemonic {
  const key = char.toUpperCase();
  const hintKey = `mnemonics.${key}.hint`;

  if (!i18n.exists(hintKey)) {
    return { hint: i18n.t("mnemonics.fallbackHint"), examples: [] };
  }

  const hint = i18n.t(hintKey);
  const examplesKey = `mnemonics.${key}.examples`;
  const examplesRaw = i18n.exists(examplesKey) ? i18n.t(examplesKey) : "";

  return {
    hint,
    examples: examplesRaw ? examplesRaw.split("|") : [],
  };
}
