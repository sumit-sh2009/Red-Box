import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

type RevealAs = 'div' | 'span' | 'section' | 'article' | 'header' | 'main' | 'aside' | 'li';

interface RevealProps {
  as?: RevealAs;
  delay?: number;
  duration?: number;
  /** Y-translate distance (px). Default 8. */
  y?: number;
  className?: string;
  children: React.ReactNode;
  /** When false, animation is skipped (e.g. item already visible). */
  inView?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  as = 'div',
  delay = 0,
  duration = 0.32,
  y = 8,
  className = '',
  children,
  inView = true,
}) => {
  const reduced = useReducedMotion();

  const initial = reduced ? { opacity: 0 } : { opacity: 0, y };
  const animate = reduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const transition = {
    duration: reduced ? 0.18 : duration,
    delay: reduced ? 0 : delay,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };

  const props = {
    initial,
    animate: inView ? animate : initial,
    transition,
    className,
  };

  const Tag = motion[as];
  return <Tag {...props}>{children}</Tag>;
};

export default Reveal;
