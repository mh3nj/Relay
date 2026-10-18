import { kvGet, kvSet } from "@/lib/db";
import { CHAR_TO_MORSE, MORSE_TO_CHAR, isValidMorseToken } from "@/lib/morse";

export interface CustomDictionary {
  id: string;
  name: string;
  /** Character -> dot/dash mapping. Only overrides/additions relative
   * to the default ITU alphabet are stored here; lookups fall back to
   * the default for any character not present. */
  entries: Record<string, string>;
}

const KEY = "customDictionaries";
const ACTIVE_KEY = "activeDictionaryId";

export async function getAllDictionaries(): Promise<CustomDictionary[]> {
  return (await kvGet<CustomDictionary[]>(KEY)) ?? [];
}

export async function saveDictionaries(dicts: CustomDictionary[]): Promise<void> {
  await kvSet(KEY, dicts);
}

export async function getActiveDictionaryId(): Promise<string | null> {
  return (await kvGet<string>(ACTIVE_KEY)) ?? null;
}

export async function setActiveDictionaryId(id: string | null): Promise<void> {
  await kvSet(ACTIVE_KEY, id);
}

function newId(): string {
  return `dict_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createDictionary(name: string): Promise<CustomDictionary> {
  const dicts = await getAllDictionaries();
  const dict: CustomDictionary = { id: newId(), name, entries: {} };
  await saveDictionaries([...dicts, dict]);
  return dict;
}

export async function duplicateDictionary(id: string): Promise<CustomDictionary | null> {
  const dicts = await getAllDictionaries();
  const source = dicts.find((d) => d.id === id);
  if (!source) return null;
  const copy: CustomDictionary = {
    id: newId(),
    name: `${source.name} copy`,
    entries: { ...source.entries },
  };
  await saveDictionaries([...dicts, copy]);
  return copy;
}

export async function renameDictionary(id: string, name: string): Promise<void> {
  const dicts = await getAllDictionaries();
  await saveDictionaries(dicts.map((d) => (d.id === id ? { ...d, name } : d)));
}

export async function updateDictionaryEntries(
  id: string,
  entries: Record<string, string>
): Promise<void> {
  const dicts = await getAllDictionaries();
  await saveDictionaries(dicts.map((d) => (d.id === id ? { ...d, entries } : d)));
}

export async function addDictionary(dict: CustomDictionary): Promise<void> {
  const dicts = await getAllDictionaries();
  await saveDictionaries([...dicts, dict]);
}

export async function deleteDictionary(id: string): Promise<void> {
  const dicts = await getAllDictionaries();
  await saveDictionaries(dicts.filter((d) => d.id !== id));
  const activeId = await getActiveDictionaryId();
  if (activeId === id) await setActiveDictionaryId(null);
}

/** Merges a custom dictionary's entries over the default alphabet for
 * text->Morse encoding. Custom entries take precedence. */
export function buildEncodeMap(dict: CustomDictionary | null): Record<string, string> {
  if (!dict) return CHAR_TO_MORSE;
  return { ...CHAR_TO_MORSE, ...dict.entries };
}

/** Merges a custom dictionary's entries over the default alphabet for
 * Morse->text decoding, inverting the custom entries first. */
export function buildDecodeMap(dict: CustomDictionary | null): Record<string, string> {
  if (!dict) return MORSE_TO_CHAR;
  const customDecode = Object.fromEntries(
    Object.entries(dict.entries).map(([char, code]) => [code, char])
  );
  return { ...MORSE_TO_CHAR, ...customDecode };
}

export interface DictionaryValidationIssue {
  char: string;
  code: string;
  conflictsWith?: string;
}

/** Flags entries that aren't valid dot/dash, and codes that collide
 * with another character in the same dictionary (ambiguous decoding).
 * Doesn't block saving, it only surfaces the warning in the editor. */
export function validateDictionary(entries: Record<string, string>): DictionaryValidationIssue[] {
  const issues: DictionaryValidationIssue[] = [];
  const seenCodes = new Map<string, string>();

  for (const [char, code] of Object.entries(entries)) {
    if (!code || !isValidMorseToken(code)) {
      issues.push({ char, code });
      continue;
    }
    const existing = seenCodes.get(code);
    if (existing && existing !== char) {
      issues.push({ char, code, conflictsWith: existing });
    }
    seenCodes.set(code, char);
  }
  return issues;
}

export function exportDictionary(dict: CustomDictionary): string {
  return JSON.stringify(dict, null, 2);
}

export function parseImportedDictionary(json: string): CustomDictionary | null {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed === "object" &&
      parsed &&
      typeof parsed.name === "string" &&
      typeof parsed.entries === "object"
    ) {
      return { id: newId(), name: parsed.name, entries: parsed.entries };
    }
    return null;
  } catch {
    return null;
  }
}
