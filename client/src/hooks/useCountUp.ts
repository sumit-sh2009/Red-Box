import { useEffect, useRef, useState } from 'react';
import { useReducedMotionSafe } from './useReducedMotionSafe.js';

interface UseCountUpOptions {
  duration?: number;
  /** Start counting when this flips true. Useful for reveal-on-scroll. */
  enabled?: boolean;
}

/**
 * Animates a numeric value toward `target` with easeOutCubic over `duration` ms.
 * - When `prefers-reduced-motion: reduce` is set, snaps instantly.
 * - When `enabled` is false, holds at the previous value.
 */
export function useCountUp(
  target: number,
  { duration = 600, enabled = true }: UseCountUpOptions = {}
): number {
  const reduced = useReducedMotionSafe();
  const [value, setValue] = useState<number>(target);
  const startRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    if (!enabled) return;
    if (reduced) {
      setValue(target);
      return;
    }
    if (typeof window === 'undefined') {
      setValue(target);
      return;
    }

    fromRef.current = startRef.current;
    const startTime = performance.now();
    const delta = target - fromRef.current;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + delta * eased;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = target;
        setValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled, reduced]);

  return value;
}
