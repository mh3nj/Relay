import { useCallback, useEffect, useState } from "react";
import { runAutoBackupSnapshot, getLastAutoBackupTime } from "@/lib/backup";

const DEFAULT_INTERVAL_MINUTES = 15;

/**
 * Runs a silent local snapshot (IndexedDB → IndexedDB, not a file
 * download) on an interval while the app is open. Browsers require a
 * user gesture for repeated file-save dialogs, so this intentionally
 * does NOT try to trigger automatic downloads. That would either be
 * blocked outright or spam the user with save dialogs every interval.
 * The manual "Download Backup Now" button in Settings covers the
 * download-a-file case.
 */
export function useAutoBackup(intervalMinutes: number = DEFAULT_INTERVAL_MINUTES) {
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>();

  const refreshLastBackupTime = useCallback(async () => {
    setLastBackupAt(await getLastAutoBackupTime());
  }, []);

  useEffect(() => {
    void refreshLastBackupTime();
  }, [refreshLastBackupTime]);

  useEffect(() => {
    const run = async () => {
      await runAutoBackupSnapshot();
      await refreshLastBackupTime();
    };
    // Snapshot shortly after load, then on the configured interval.
    const initial = setTimeout(run, 10_000);
    const interval = setInterval(run, intervalMinutes * 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [intervalMinutes, refreshLastBackupTime]);

  return { lastBackupAt };
}
