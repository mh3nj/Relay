import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { getMnemonic } from "@/lib/mnemonics";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { useMorsePlayer } from "@/hooks/useMorsePlayer";
import { useAudioDefaults } from "@/hooks/useAudioDefaults";
import { LessonProgressBar } from "@/features/learn/components/LessonProgressBar";
import { CharacterHero } from "@/features/learn/components/CharacterHero";
import { SignalAnalysis } from "@/features/learn/components/SignalAnalysis";
import { TransmissionPractice } from "@/features/learn/components/TransmissionPractice";
import { MnemonicPanel } from "@/features/learn/components/MnemonicPanel";
import { LessonNav } from "@/features/learn/components/LessonNav";

export function LearnPage() {
  const { t } = useTranslation();
  const {
    loaded,
    currentChar,
    lessonIndex,
    totalLessons,
    hasPrevious,
    hasNext,
    isLastLesson,
    readyToAdvance,
    currentCharStat,
    minAttemptsToAdvance,
    nextLesson,
    previousLesson,
    recordAttempt,
  } = useLearnProgress();

  const audioDefaults = useAudioDefaults();
  const { play, stop, isPlaying, activeSymbolIndex } = useMorsePlayer(audioDefaults.wpm, {
    frequency: audioDefaults.frequency,
    volume: audioDefaults.volume,
    farnsworthWpm: audioDefaults.farnsworthWpm ?? undefined,
  });

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        {t("learn.loadingProgress")}
      </div>
    );
  }

  const code = CHAR_TO_MORSE[currentChar] ?? "";
  const mnemonic = getMnemonic(currentChar);

  return (
    <>
      <LessonProgressBar index={lessonIndex} total={totalLessons} />

      {lessonIndex === 0 && (
        <p className="text-label-sm text-on-surface-variant bg-surface-container rounded-lg px-md py-sm border border-outline-variant/30">
          {t("learn.masteryGate.kochExplainer")}
        </p>
      )}

      <div
        key={`hero-${currentChar}`}
        className="grid grid-cols-1 lg:grid-cols-12 gap-lg h-auto lg:h-[400px] reveal-item"
      >
        <CharacterHero char={currentChar} code={code} />
        <SignalAnalysis
          code={code}
          wpm={audioDefaults.wpm}
          isPlaying={isPlaying}
          activeSymbolIndex={activeSymbolIndex}
          onPlay={() => play(code)}
          onStop={stop}
        />
      </div>

      <div
        key={`practice-${currentChar}`}
        className="grid grid-cols-1 lg:grid-cols-3 gap-lg reveal-item"
        style={{ "--reveal-delay": "70ms" } as CSSProperties}
      >
        <TransmissionPractice
          code={code}
          char={currentChar}
          wpm={audioDefaults.wpm}
          onComplete={(correct) => recordAttempt(currentChar, correct)}
        />
        <MnemonicPanel char={currentChar} mnemonic={mnemonic} />
      </div>

      <LessonNav
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        isLastLesson={isLastLesson}
        readyToAdvance={readyToAdvance}
        currentCharStat={currentCharStat}
        minAttemptsToAdvance={minAttemptsToAdvance}
        onPrevious={previousLesson}
        onNext={nextLesson}
      />
    </>
  );
}
