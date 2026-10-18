import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives a retriggerable "shake" flag for wrong-answer feedback. Calling
 * trigger() again while already shaking restarts the animation cleanly
 * (a one-frame reset avoids the CSS animation being a no-op on repeat).
 */
export function useScreenShake(durationMs = 380) {
  const [shaking, setShaking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  const trigger = useCallback(() => {
    setShaking(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      setShaking(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShaking(false), durationMs);
    });
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return { shaking, trigger };
}
