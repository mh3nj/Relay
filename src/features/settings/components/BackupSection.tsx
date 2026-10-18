import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardEyebrow } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { downloadJson } from "@/lib/exportUtils";
import { buildBackup, isValidBackupFile, restoreBackup, factoryReset, type BackupFile } from "@/lib/backup";
import { isFileSystemAccessSupported, saveJsonToSyncedFolder } from "@/lib/syncedFolder";
import { useAutoBackup } from "@/hooks/useAutoBackup";

type RestoreStatus = "idle" | "success" | "error";

export function BackupSection() {
  const { t } = useTranslation();
  const { lastBackupAt } = useAutoBackup();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>("idle");
  // A validated file waiting for the person to confirm. Restoring
  // overwrites current progress, so choosing a file alone must not do it.
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null);
  const [savingToFolder, setSavingToFolder] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetError, setResetError] = useState(false);

  const handleDownloadNow = async () => {
    try {
      const backup = await buildBackup();
      downloadJson(backup, `relay-backup-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (err) {
      console.error("Download backup failed", err);
    }
  };

  const handleSaveToFolder = async () => {
    setSavingToFolder(true);
    try {
      const backup = await buildBackup();
      await saveJsonToSyncedFolder(
        backup,
        `relay-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
    } catch (err) {
      console.error("Save to synced folder failed", err);
    } finally {
      setSavingToFolder(false);
    }
  };

  // Step 1: read + validate only. An invalid file errors immediately;
  // a valid one waits for confirmation instead of overwriting right away.
  const handleRestoreFile = async (file: File) => {
    setRestoreStatus("idle");
    setPendingRestore(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!isValidBackupFile(parsed)) {
        setRestoreStatus("error");
        return;
      }
      setPendingRestore(parsed);
    } catch (err) {
      console.error("Restore failed", err);
      setRestoreStatus("error");
    }
  };

  // Step 2: the actual overwrite, only after the person confirms.
  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    const file = pendingRestore;
    setPendingRestore(null);
    try {
      await restoreBackup(file);
      setRestoreStatus("success");
    } catch (err) {
      console.error("Restore failed", err);
      setRestoreStatus("error");
    }
  };

  const handleFactoryReset = async () => {
    setResetError(false);
    try {
      await factoryReset();
      setConfirmingReset(false);
      window.location.reload();
    } catch (err) {
      console.error("Factory reset failed", err);
      setResetError(true);
      setConfirmingReset(false);
    }
  };

  return (
    <Card className="p-lg flex flex-col gap-lg">
      <div>
        <CardEyebrow>{t("settings.sections.backup")}</CardEyebrow>
        <p className="text-body-md text-on-surface-variant mt-xs">
          {t("settings.backup.description")}
        </p>
      </div>

      {/* Automatic local backup status */}
      <div className="flex items-center justify-between gap-md p-md rounded-lg bg-surface border border-outline-variant/30">
        <div className="flex items-center gap-sm">
          <Icon name="clock" className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-on-surface">{t("settings.backup.autoBackup")}</p>
            <p className="text-label-sm text-on-surface-variant">
              {lastBackupAt
                ? t("settings.backup.lastBackup", {
                    time: new Date(lastBackupAt).toLocaleString(),
                  })
                : t("settings.backup.neverBackedUp")}
            </p>
          </div>
        </div>
      </div>

      {/* Manual actions */}
      <div className="flex flex-wrap gap-sm">
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="download" className="w-4 h-4" />}
          onClick={handleDownloadNow}
        >
          {t("settings.backup.downloadNow")}
        </Button>

        {isFileSystemAccessSupported() && (
          <Button
            variant="secondary"
            size="sm"
            disabled={savingToFolder}
            icon={
              savingToFolder ? (
                <Icon name="spinner" spin className="w-4 h-4" />
              ) : (
                <Icon name="folder" className="w-4 h-4" />
              )
            }
            onClick={handleSaveToFolder}
          >
            {t("settings.backup.saveToFolder")}
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleRestoreFile(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          size="sm"
          icon={<Icon name="upload" className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("settings.backup.restoreFromFile")}
        </Button>
      </div>

      {!isFileSystemAccessSupported() && (
        <p className="text-label-sm text-on-surface-variant">
          {t("settings.backup.saveToFolderUnsupported")}
        </p>
      )}
      {pendingRestore && (
        <div className="flex flex-col gap-sm">
          <p className="text-error text-label-sm">{t("settings.backup.restoreWarning")}</p>
          <div className="flex gap-sm">
            <Button variant="danger" size="sm" onClick={handleConfirmRestore}>
              {t("settings.backup.restoreFromFile")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPendingRestore(null)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
      {restoreStatus === "success" && (
        <p className="text-primary text-label-sm">{t("settings.backup.restoreSuccess")}</p>
      )}
      {restoreStatus === "error" && (
        <p className="text-error text-label-sm">{t("settings.backup.restoreFailed")}</p>
      )}

      {/* Factory reset */}
      <div className="pt-md border-t border-outline-variant/30">
        {resetError && (
          <p className="text-error text-label-sm mb-sm">{t("settings.backup.resetFailed")}</p>
        )}
        {!confirmingReset ? (
          <Button variant="danger" size="sm" onClick={() => setConfirmingReset(true)}>
            {t("settings.backup.factoryReset")}
          </Button>
        ) : (
          <div className="flex flex-col gap-sm">
            <p className="text-error text-label-sm">{t("settings.backup.factoryResetWarning")}</p>
            <div className="flex gap-sm">
              <Button variant="danger" size="sm" onClick={handleFactoryReset}>
                {t("settings.backup.factoryResetConfirm")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmingReset(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
