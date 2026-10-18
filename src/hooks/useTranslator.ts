import { useCallback, useMemo, useState } from "react";
import { textToMorse, morseToText, CHAR_TO_MORSE, MORSE_TO_CHAR } from "@/lib/morse";

type SourceMode = "text" | "morse";

interface UseTranslatorOptions {
  encodeMap?: Record<string, string>;
  decodeMap?: Record<string, string>;
  /** Pre-process text before encoding (e.g. transliterate to Latin) */
  encodePreprocess?: (text: string) => string;
  /** Post-process decoded text (e.g. reverse transliterate from Latin) */
  decodePostprocess?: (text: string) => string;
}

export function useTranslator({
  encodeMap,
  decodeMap,
  encodePreprocess = (s: string) => s,
  decodePostprocess = (s: string) => s,
}: UseTranslatorOptions = {}) {
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [rawText, setRawText] = useState("");
  const [rawMorse, setRawMorse] = useState("");

  const activeEncodeMap = encodeMap ?? CHAR_TO_MORSE;
  const activeDecodeMap = decodeMap ?? MORSE_TO_CHAR;

  const plainText = sourceMode === "text" ? rawText : decodePostprocess(morseToText(rawMorse, activeDecodeMap));
  const morse = sourceMode === "morse" ? rawMorse : textToMorse(encodePreprocess(rawText), activeEncodeMap);

  const setPlainText = useCallback((value: string) => {
    setSourceMode("text");
    setRawText(value);
  }, []);

  const setMorseText = useCallback((value: string) => {
    setSourceMode("morse");
    setRawMorse(value);
  }, []);

  const swap = useCallback(() => {
    if (sourceMode === "text") {
      setRawMorse(morse);
      setSourceMode("morse");
    } else {
      setRawText(plainText);
      setSourceMode("text");
    }
  }, [sourceMode, morse, plainText]);

  const clear = useCallback(() => {
    setRawText("");
    setRawMorse("");
    setSourceMode("text");
  }, []);

  const loadText = useCallback((value: string) => {
    setSourceMode("text");
    setRawText(value);
  }, []);

  return useMemo(
    () => ({
      plainText,
      morse,
      sourceMode,
      setPlainText,
      setMorseText,
      swap,
      clear,
      loadText,
    }),
    [plainText, morse, sourceMode, setPlainText, setMorseText, swap, clear, loadText]
  );
}
