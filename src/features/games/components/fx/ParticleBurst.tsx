import { useMemo } from "react";
import type { CSSProperties } from "react";

interface ParticleBurstProps {
  /** Bump this on every correct answer to retrigger the burst. 0 = no burst yet. */
  burstId: number;
  color?: string;
  count?: number;
}

/** Lightweight, canvas-free particle burst: a handful of dots flung
 * outward and faded via a shared CSS keyframe. Purely decorative, so it
 * renders nothing until the first burst and unmounts/remounts on each
 * new burstId to restart the animation. */
export function ParticleBurst({ burstId, color = "var(--color-primary)", count = 10 }: ParticleBurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const distance = 22 + Math.random() * 26;
        return { id: i, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance };
      }),
    // Recompute only when a new burst fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstId, count]
  );

  if (burstId === 0) return null;

  return (
    <div
      key={burstId}
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              backgroundColor: color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
