import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { timingForWpm } from "@/lib/morse";
import { playCorrectSfx, playComboSfx, playWrongSfx } from "@/lib/gameSfx";
import { ParticleBurst } from "@/features/games/components/fx/ParticleBurst";

interface TransmissionPracticeProps {
  code: string;
  char: string;
  /** wpm used only to derive the dot/dash classification threshold */
  wpm?: number;
  onComplete: (correct: boolean) => void;
}

type SlotStatus = "pending" | "correct";

export function TransmissionPractice({
  code,
  char,
  wpm = 15,
  onComplete,
}: TransmissionPracticeProps) {
  const { t } = useTranslation();
  const target = code.split("");
  const [slotStatus, setSlotStatus] = useState<SlotStatus[]>(target.map(() => "pending"));
  const [errorFlash, setErrorFlash] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const isPressingRef = useRef(false);
  const pressStart = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slotRef = useRef(slotStatus);
  slotRef.current = slotStatus;

  // Reset local practice state whenever the lesson character changes.
  useEffect(() => {
    setSlotStatus(target.map(() => "pending"));
    setErrorFlash(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const { ditMs, dahMs } = timingForWpm(wpm);
  const threshold = (ditMs + dahMs) / 2;

  /** Core slot-matching logic, called by all input methods:
   * mouse hold (timing-based), Left-Ctrl = dot / Right-Ctrl = dash. */
  const submitSymbol = useCallback(
    (symbol: "." | "-") => {
      const prev = slotRef.current;
      const filledCount = prev.filter((s) => s === "correct").length;
      const expected = target[filledCount];

      if (symbol === expected) {
        const next: SlotStatus[] = [...prev];
        next[filledCount] = "correct";
        setSlotStatus(next);
        if (filledCount + 1 === target.length) {
          playComboSfx(1);
          setBurstId((b) => b + 1);
          onComplete(true);
          if (resetTimer.current) clearTimeout(resetTimer.current);
          resetTimer.current = setTimeout(() => {
            setSlotStatus(target.map(() => "pending"));
          }, 900);
        } else {
          playCorrectSfx();
        }
      } else {
        playWrongSfx();
        setErrorFlash(true);
        onComplete(false);
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => {
          setErrorFlash(false);
          setSlotStatus(target.map(() => "pending"));
        }, 600);
      }
    },
    [target, onComplete]
  );

  const handlePress = useCallback(() => {
    if (isPressingRef.current) return;
    isPressingRef.current = true;
    setIsPressing(true);
    pressStart.current = performance.now();
  }, []);

  const handleRelease = useCallback(() => {
    if (!isPressingRef.current) return;
    isPressingRef.current = false;
    setIsPressing(false);
    const duration = performance.now() - pressStart.current;
    const symbol: "." | "-" = duration < threshold ? "." : "-";
    submitSymbol(symbol);
  }, [threshold, submitSymbol]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ControlLeft" && !e.repeat) {
        e.preventDefault();
        submitSymbol(".");
      } else if (e.code === "ControlRight" && !e.repeat) {
        e.preventDefault();
        submitSymbol("-");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitSymbol]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  return (
    <div className="lg:col-span-2 bg-surface-container border border-outline-variant/30 rounded-xl p-lg flex flex-col">
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("learn.transmissionPractice")}
        </h3>
        <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
          <Icon name="keyboard" className="w-4 h-4" />
          <span>
            {t("learn.ctrlKeyHint")}
          </span>
        </div>
      </div>

      <button
        type="button"
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={() => isPressing && handleRelease()}
        onTouchStart={(e) => {
          e.preventDefault();
          handlePress();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleRelease();
        }}
        className={cn(
          "flex-1 min-h-[160px] border-2 border-dashed rounded-lg bg-surface flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
          isPressing ? "border-primary bg-surface-container" : "border-outline-variant hover:border-primary"
        )}
        aria-label={t("learn.tapToTransmit", { char }) ?? ""}
      >
        <Icon
          name="hand"
          className="w-10 h-10 text-outline-variant group-hover:text-primary transition-colors mb-sm"
        />
        <p className="font-body-md text-body-md text-on-surface-variant text-center px-md">
          {t("learn.tapToTransmit", { char })}
        </p>

        <div className="flex gap-sm mt-lg">
          {target.map((symbol, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full border transition-colors",
                symbol === "-" ? "w-10 h-3" : "w-4 h-3",
                errorFlash
                  ? "bg-error border-error"
                  : slotStatus[i] === "correct"
                    ? "bg-primary border-primary shadow-[0_0_10px_rgba(192,193,255,0.8)]"
                    : "bg-surface-container-high border-outline-variant"
              )}
            />
          ))}
        </div>
        <ParticleBurst burstId={burstId} color="var(--color-primary)" count={10} />
      </button>

      <div className="flex gap-md mt-md">
        <button
          type="button"
          onClick={() => submitSymbol(".")}
          disabled={errorFlash}
          className="flex-1 h-14 rounded-xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center gap-sm hover:border-primary hover:bg-surface-container transition-colors disabled:opacity-40"
          aria-label={t("learn.dot") ?? "Dot"}
        >
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span className="font-body-md text-body-md text-on-surface font-medium">·</span>
        </button>
        <button
          type="button"
          onClick={() => submitSymbol("-")}
          disabled={errorFlash}
          className="flex-1 h-14 rounded-xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center gap-sm hover:border-primary hover:bg-surface-container transition-colors disabled:opacity-40"
          aria-label={t("learn.dash") ?? "Dash"}
        >
          <span className="w-8 h-2 rounded-sm bg-primary" />
        </button>
      </div>
    </div>
  );
}
