import { useRef, useCallback, type MouseEvent } from 'react';
import { useReducedMotion } from 'motion/react';

/** Subtle pointer-follow lift for primary CTAs — CSS class civic-magnetic handles transition. */
export function useMagneticHover(strength = 6) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (reduce || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      ref.current.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
    },
    [reduce, strength]
  );

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = '';
  }, []);

  return { ref, onMouseMove, onMouseLeave, className: 'civic-magnetic civic-focus' };
}
