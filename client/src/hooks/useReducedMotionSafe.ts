import React, { useEffect, useState } from 'react';

/**
 * SSR-safe reduced motion hook.
 * - Returns `true` when the user has requested reduced motion at the OS level.
 * - Returns `false` during SSR (so server-rendered content doesn't disappear).
 * - Re-evaluates on media query change (e.g. user toggles the setting live).
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    // Safari < 14 fallback
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);

  return reduced;
}
