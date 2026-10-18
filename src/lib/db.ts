import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";

/**
 * Generic key-value persistence layer on IndexedDB. Every feature store
 * (learn progress, practice stats, settings, dictionaries) writes a
 * single JSON-serializable record under its own key here, rather than
 * each owning a bespoke object store. This keeps the schema simple and
 * makes "export everything to JSON" / "factory reset" trivial later,
 * both just iterate this one store.
 */

interface MorseMasterDB extends DBSchema {
  kv: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "relay";
const DB_VERSION = 1;
const STORE = "kv";

let dbPromise: Promise<IDBPDatabase<MorseMasterDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<MorseMasterDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    }).catch((err) => {
      // Don't let a failed connection (private-browsing quota limits,
      // a browser with IndexedDB disabled, etc.) permanently poison
      // every future call, so clear the cached promise and let the next
      // attempt can retry instead of re-awaiting the same rejection
      // forever.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await getDb();
    return (await db.get(STORE, key)) as T | undefined;
  } catch (err) {
    console.error(`[db] failed to read "${key}"`, err);
    return undefined;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE, value, key);
  } catch (err) {
    console.error(`[db] failed to write "${key}"`, err);
  }
}

export async function kvDelete(key: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE, key);
  } catch (err) {
    console.error(`[db] failed to delete "${key}"`, err);
  }
}

export async function kvAllKeys(): Promise<string[]> {
  try {
    const db = await getDb();
    return (await db.getAllKeys(STORE)) as string[];
  } catch (err) {
    console.error("[db] failed to list keys", err);
    return [];
  }
}

/** Dump every record for backup export. Returns an empty object rather
 * than throwing if storage is unavailable, so a failed export shows up
 * as "nothing to back up" instead of crashing the Settings page. */
export async function kvExportAll(): Promise<Record<string, unknown>> {
  try {
    const db = await getDb();
    const keys = (await db.getAllKeys(STORE)) as string[];
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = await db.get(STORE, key);
    }
    return out;
  } catch (err) {
    console.error("[db] failed to export all records", err);
    return {};
  }
}

/** Restore a full backup dump, overwriting existing records. */
export async function kvImportAll(data: Record<string, unknown>): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE, "readwrite");
    await Promise.all([
      ...Object.entries(data).map(([key, value]) => tx.store.put(value, key)),
      tx.done,
    ]);
  } catch (err) {
    console.error("[db] failed to import records", err);
    throw err; // the restore UI needs to know this failed to show an error
  }
}

/** Wipe every record. Used by factory reset. */
export async function kvClearAll(): Promise<void> {
  try {
    const db = await getDb();
    await db.clear(STORE);
  } catch (err) {
    console.error("[db] failed to clear all records", err);
    throw err; // factory reset needs to know this failed, not silently no-op
  }
}
