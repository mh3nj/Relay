import { useCallback, useEffect, useState } from "react";
import {
  getAllDictionaries,
  getActiveDictionaryId,
  setActiveDictionaryId,
  createDictionary,
  duplicateDictionary,
  renameDictionary,
  updateDictionaryEntries,
  deleteDictionary,
  addDictionary,
  buildEncodeMap,
  buildDecodeMap,
} from "@/lib/customDictionary";
import type { CustomDictionary } from "@/lib/customDictionary";

export function useDictionaries() {
  const [dictionaries, setDictionaries] = useState<CustomDictionary[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllDictionaries(), getActiveDictionaryId()]).then(([dicts, active]) => {
      if (cancelled) return;
      setDictionaries(dicts);
      // An active id pointing at a since-deleted dictionary falls back
      // to the default alphabet rather than erroring.
      setActiveIdState(active && dicts.some((d) => d.id === active) ? active : null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setDictionaries(await getAllDictionaries());
  }, []);

  const selectDictionary = useCallback(async (id: string | null) => {
    setActiveIdState(id);
    await setActiveDictionaryId(id);
  }, []);

  const active = dictionaries.find((d) => d.id === activeId) ?? null;

  const create = useCallback(
    async (name: string) => {
      const dict = await createDictionary(name);
      await refresh();
      return dict;
    },
    [refresh]
  );

  const duplicate = useCallback(
    async (id: string) => {
      const dict = await duplicateDictionary(id);
      await refresh();
      return dict;
    },
    [refresh]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await renameDictionary(id, name);
      await refresh();
    },
    [refresh]
  );

  const updateEntries = useCallback(
    async (id: string, entries: Record<string, string>) => {
      await updateDictionaryEntries(id, entries);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDictionary(id);
      if (activeId === id) setActiveIdState(null);
      await refresh();
    },
    [refresh, activeId]
  );

  const addImported = useCallback(
    async (dict: CustomDictionary) => {
      await addDictionary(dict);
      await refresh();
    },
    [refresh]
  );

  return {
    loaded,
    dictionaries,
    active,
    activeId,
    selectDictionary,
    create,
    duplicate,
    rename,
    updateEntries,
    remove,
    addImported,
    encodeMap: buildEncodeMap(active),
    decodeMap: buildDecodeMap(active),
  };
}
