import { kvExportAll, kvImportAll, kvGet, kvSet, kvClearAll } from "@/lib/db";

/**
 * Backup payload shape. Leaves out the "aiSettings" key, which holds the
 * user's AI provider API key. That value stays on this device, even if
 * the backup file gets shared or uploaded somewhere.
 */
const EXCLUDED_FROM_BACKUP = new Set(["aiSettings", "autoBackupSnapshot", "lastAutoBackupAt"]);

/** Drop the keys buildBackup never exports. Applied on
 * *import* too: a backup file is user-supplied input, and without this a
 * hand-edited or downloaded file could overwrite "aiSettings" wholesale
 * (provider, custom endpoint, enabled flag, key), so the exclusion list
 * would only have protected the export direction. */
export function sanitizeBackupData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!EXCLUDED_FROM_BACKUP.has(key)) out[key] = value;
  }
  return out;
}

export interface BackupFile {
  schemaVersion: 1;
  app: "relay";
  exportedAt: string;
  data: Record<string, unknown>;
}

export async function buildBackup(): Promise<BackupFile> {
  const all = await kvExportAll();
  return {
    schemaVersion: 1,
    app: "relay",
    exportedAt: new Date().toISOString(),
    data: sanitizeBackupData(all),
  };
}

export function isValidBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.app === "relay" && typeof v.data === "object" && v.data !== null && !Array.isArray(v.data);
}

export async function restoreBackup(file: BackupFile): Promise<void> {
  await kvImportAll(sanitizeBackupData(file.data));
}

export async function factoryReset(): Promise<void> {
  await kvClearAll();
}

const LAST_AUTO_BACKUP_KEY = "lastAutoBackupAt";
const AUTO_BACKUP_SNAPSHOT_KEY = "autoBackupSnapshot";

export async function getLastAutoBackupTime(): Promise<string | undefined> {
  return kvGet<string>(LAST_AUTO_BACKUP_KEY);
}

/** Silently snapshot current progress into IndexedDB itself (not a file
 * download), safe to run on an interval without spamming the user with
 * "Save File" dialogs, which most browsers require a gesture for anyway. */
export async function runAutoBackupSnapshot(): Promise<void> {
  const backup = await buildBackup();
  await kvSet(AUTO_BACKUP_SNAPSHOT_KEY, backup);
  await kvSet(LAST_AUTO_BACKUP_KEY, backup.exportedAt);
}
