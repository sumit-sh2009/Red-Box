import { useReducedMotion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import type { Variants, Transition } from 'motion/react';

export const civicEase = [0.22, 1, 0.36, 1] as [number, number, number, number];
export const civicSpring = { type: 'spring' as const, stiffness: 260, damping: 25, mass: 0.8 };

export function useCivicMotion() {
  const reduce = useReducedMotion();
  return {
    reduce,
    fadeUp: reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
        },
    list: reduce
      ? { initial: {}, animate: {} }
      : {
          initial: {},
          animate: {
            transition: { staggerChildren: 0.06, delayChildren: 0.04 },
          },
        },
    item: reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: civicEase } },
        },
  };
}

/* ─── Page-level section stagger ─── */
export const sectionStagger: { container: Variants; item: Variants } = {
  container: {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.42, ease: civicEase },
    },
  },
};

/* ─── Modal animation ─── */
export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  },
  panel: {
    initial: { opacity: 0, y: 16, scale: 0.97 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.28, ease: civicEase },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.98,
      transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
    },
  },
};

/* ─── Card hover interaction ─── */
export const cardHover = {
  whileHover: { y: -2, transition: { duration: 0.2, ease: civicEase } },
  whileTap: { scale: 0.985, transition: { duration: 0.1 } },
};

/* ─── Count-up hook ─── */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  const animFrame = useRef(0);

  useEffect(() => {
    const startVal = prevTarget.current;
    prevTarget.current = target;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(tick);
      }
    };

    animFrame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame.current);
  }, [target, duration]);

  return value;
}
