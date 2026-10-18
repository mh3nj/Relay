import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { decodeAudioFile } from "@/lib/audioDecoder";
import type { DecodeResult } from "@/lib/audioDecoder";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

type ErrorKey =
  | "translator.fileTooLarge"
  | "translator.notAudioFile"
  | "translator.noSignalDetected"
  | "translator.decodeFailed";

interface DecodeAudioPanelProps {
  onDecoded: (text: string) => void;
  decodeMap?: Record<string, string>;
}

export function DecodeAudioPanel({ onDecoded, decodeMap }: DecodeAudioPanelProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setErrorKey(null);
      setResult(null);

      if (file.size > MAX_SIZE_BYTES) {
        setErrorKey("translator.fileTooLarge");
        return;
      }
      if (!file.type.startsWith("audio/")) {
        setErrorKey("translator.notAudioFile");
        return;
      }

      setIsDecoding(true);
      try {
        const decoded = await decodeAudioFile(file, decodeMap);
        setResult(decoded);
        if (decoded.text) onDecoded(decoded.text);
        if (!decoded.morse) {
          setErrorKey("translator.noSignalDetected");
        }
      } catch (err) {
        console.error(err);
        setErrorKey("translator.decodeFailed");
      } finally {
        setIsDecoding(false);
      }
    },
    [onDecoded, decodeMap]
  );

  return (
    <Card className="p-lg flex flex-col">
      <h3 className="font-heading-md text-heading-md text-on-surface mb-md">
        {t("translator.decodeAudio")}
      </h3>
      <p className="text-body-md text-on-surface-variant mb-lg">
        {t("translator.decodeAudioDescription")}
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-lg text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-surface-container-high"
            : "border-outline-variant hover:bg-surface-container-high hover:border-primary"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        {isDecoding ? (
          <>
            <Icon name="spinner" spin className="w-8 h-8 text-primary mb-sm" />
            <span className="text-body-md font-medium text-on-surface">
              {t("translator.decoding")}
            </span>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-primary mb-sm">
              <Icon name="upload" className="w-5 h-5" />
            </div>
            <span className="text-body-md font-medium text-on-surface">
              {t("translator.clickToUpload")}
            </span>
            <span className="text-label-sm text-outline mt-xs">{t("translator.orDragAndDrop")}</span>
            <span className="text-label-sm text-outline mt-xs">{t("translator.fileSizeLimit")}</span>
          </>
        )}
      </label>

      {errorKey && (
        <div className="mt-md flex items-start gap-sm text-error text-sm">
          <Icon name="alertTriangle" className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t(errorKey)}</span>
        </div>
      )}

      {result && result.text && (
        <div className="mt-md">
          <div className="flex items-center gap-sm text-primary text-sm mb-xs">
            <Icon name="checkCircle" className="w-4 h-4" />
            <span>{t("translator.decoded", { confidence: Math.round(result.confidence * 100) })}</span>
          </div>
          <p className="font-mono text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/50 p-sm break-words">
            {result.text}
          </p>
          {result.unknownSequences.length > 0 && (
            <p className="text-label-sm text-on-surface-variant mt-xs">
              {t("translator.unrecognizedSequences", {
                sequences: result.unknownSequences.join(", "),
              })}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-sm w-full"
            onClick={() => onDecoded(result.text)}
          >
            {t("translator.useThisText")}
          </Button>
        </div>
      )}
    </Card>
  );
}
