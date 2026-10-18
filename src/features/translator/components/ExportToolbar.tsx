import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { renderMorseToWavBlob } from "@/lib/wavEncoder";
import {
  downloadText,
  downloadJson,
  downloadBlob,
  buildTranslationExport,
  downloadMorseReferencePdf,
} from "@/lib/exportUtils";

interface ExportToolbarProps {
  plainText: string;
  morse: string;
  wpm: number;
  frequency: number;
}

export function ExportToolbar({ plainText, morse, wpm, frequency }: ExportToolbarProps) {
  const { t } = useTranslation();
  const [renderingWav, setRenderingWav] = useState(false);
  const hasContent = plainText.length > 0 || morse.length > 0;

  const handleWavDownload = async () => {
    if (!morse) return;
    setRenderingWav(true);
    try {
      const blob = await renderMorseToWavBlob(morse, { wpm, frequency });
      downloadBlob(blob, "relay-export.wav");
    } catch (err) {
      console.error("WAV export failed", err);
    } finally {
      setRenderingWav(false);
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-sm pt-md border-t border-outline-variant/30">
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasContent}
        icon={<Icon name="fileText" className="w-4 h-4" />}
        onClick={() => downloadText(plainText, "relay-translation.txt")}
      >
        {t("translator.exportTxt")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasContent}
        icon={<Icon name="fileJson" className="w-4 h-4" />}
        onClick={() =>
          downloadJson(
            buildTranslationExport(plainText, morse, wpm, frequency),
            "relay-translation.json"
          )
        }
      >
        {t("translator.exportJson")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!morse || renderingWav}
        icon={
          renderingWav ? (
            <Icon name="spinner" spin className="w-4 h-4" />
          ) : (
            <Icon name="fileAudio" className="w-4 h-4" />
          )
        }
        onClick={handleWavDownload}
      >
        {t("translator.downloadWav")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        icon={<Icon name="fileDownload" className="w-4 h-4" />}
        onClick={downloadMorseReferencePdf}
      >
        {t("translator.referencePdf")}
      </Button>
    </div>
  );
}
