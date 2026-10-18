import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTranslator } from "@/hooks/useTranslator";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";
import { getAudioDefaults } from "@/lib/settingsStore";
import { useDictionaries } from "@/hooks/useDictionaries";
import { TranslationPanel } from "@/features/translator/components/TranslationPanel";
import { SignalAnalysisPanel } from "@/features/translator/components/SignalAnalysisPanel";
import { DecodeAudioPanel } from "@/features/translator/components/DecodeAudioPanel";
import { ExportToolbar } from "@/features/translator/components/ExportToolbar";
import { DictionarySelector } from "@/features/translator/components/DictionarySelector";
import { CustomDictionaryEditor } from "@/features/translator/components/CustomDictionaryEditor";
import { TRANSLITERATION_PRESETS, applyTransliteration, transliterateHybrid, reverseTransliterateHybrid } from "@/lib/morse";

export function TranslatorPage() {
  const { t } = useTranslation();
  const dictionaries = useDictionaries();
  const [langPreset, setLangPreset] = useState("default");

  const preset = TRANSLITERATION_PRESETS[langPreset] ?? TRANSLITERATION_PRESETS.default;

  const encodePreprocess = useCallback(
    (text: string) => {
      if (langPreset === "fa" || langPreset === "ar") {
        return transliterateHybrid(text, langPreset, preset.toLatin);
      }
      return applyTransliteration(text, preset.toLatin);
    },
    [langPreset, preset]
  );

  const decodePostprocess = useCallback(
    (text: string) => {
      if (langPreset === "fa" || langPreset === "ar") {
        return reverseTransliterateHybrid(text, langPreset, preset.fromLatin);
      }
      return applyTransliteration(text, preset.fromLatin);
    },
    [langPreset, preset]
  );

  const { plainText, morse, setPlainText, setMorseText, swap, clear, loadText } = useTranslator({
    encodeMap: dictionaries.encodeMap,
    decodeMap: dictionaries.decodeMap,
    encodePreprocess,
    decodePostprocess,
  });
  const [wpm, setWpm] = useState(20);
  const [frequency, setFrequency] = useState(600);
  const audioDefaults = useAudioDefaults();

  // Seed the session's editable wpm/frequency from the saved defaults once,
  // rather than always starting at a hard-coded 20 wpm / 600 Hz regardless
  // of what's configured in Settings > Audio & Timing.
  useEffect(() => {
    let cancelled = false;
    void getAudioDefaults().then((d) => {
      if (!cancelled) {
        setWpm(d.wpm);
        setFrequency(d.frequency);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { play, stop, isPlaying, activeSymbolIndex } = useMorsePlayer(wpm, {
    frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingDict = dictionaries.dictionaries.find((d) => d.id === editingId) ?? null;

  return (
    <>
      <PageHeader title={t("translator.title")} description={t("translator.description")} />

      <div className="flex items-center gap-md mb-md">
        <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider shrink-0">
          {t("translator.script.title")}
        </label>
        <select
          value={langPreset}
          onChange={(e) => setLangPreset(e.target.value)}
          className="py-1.5 px-md rounded-lg bg-surface-container border border-outline-variant/40 text-body-md text-on-surface focus:outline-none focus:border-primary"
        >
          {Object.entries(TRANSLITERATION_PRESETS).map(([key, p]) => (
            <option key={key} value={key}>
              {t(`translator.script.${key}`, p.name)}
            </option>
          ))}
        </select>
      </div>

      <TranslationPanel
        plainText={plainText}
        morse={morse}
        onPlainTextChange={setPlainText}
        onMorseChange={setMorseText}
        onSwap={swap}
        onClear={clear}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg reveal-item" style={{ "--reveal-delay": "60ms" } as CSSProperties}>
        <SignalAnalysisPanel
          code={morse}
          isPlaying={isPlaying}
          activeSymbolIndex={activeSymbolIndex}
          wpm={wpm}
          frequency={frequency}
          onWpmChange={setWpm}
          onFrequencyChange={setFrequency}
          onPlay={() => play(morse)}
          onStop={stop}
        />
        <DecodeAudioPanel onDecoded={loadText} decodeMap={dictionaries.decodeMap} />
      </div>

      <div className="reveal-item" style={{ "--reveal-delay": "120ms" } as CSSProperties}>
        <DictionarySelector
          dictionaries={dictionaries.dictionaries}
          activeId={dictionaries.activeId}
          onSelect={dictionaries.selectDictionary}
          onCreate={dictionaries.create}
          onDuplicate={dictionaries.duplicate}
          onRename={dictionaries.rename}
          onDelete={dictionaries.remove}
          onImport={dictionaries.addImported}
          onEdit={setEditingId}
        />
      </div>

      {editingDict && (
        <CustomDictionaryEditor
          dictionary={editingDict}
          onSave={(entries) => dictionaries.updateEntries(editingDict.id, entries)}
          onClose={() => setEditingId(null)}
        />
      )}

      <ExportToolbar plainText={plainText} morse={morse} wpm={wpm} frequency={frequency} />
    </>
  );
}
