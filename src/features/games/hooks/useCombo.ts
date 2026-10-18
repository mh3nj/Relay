import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks a consecutive-correct-answer streak plus the best streak reached
 * this run. Shared across the mini-games so combo scoring/feedback stays
 * consistent instead of each game reinventing it slightly differently.
 */
export function useCombo() {
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const bestRef = useRef(0);

  const bump = useCallback(() => {
    setCombo((c) => c + 1);
  }, []);

  // `best` is derived from `combo` after the render commits rather than
  // being raised inside the setCombo updater, since React may call an updater
  // more than once, which would double every side effect it performs.
  useEffect(() => {
    if (combo > bestRef.current) {
      bestRef.current = combo;
      setBest(combo);
    }
  }, [combo]);

  const reset = useCallback(() => setCombo(0), []);

  const resetAll = useCallback(() => {
    setCombo(0);
    setBest(0);
    bestRef.current = 0;
  }, []);

  return { combo, best, bump, reset, resetAll };
}
