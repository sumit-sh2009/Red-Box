import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type PressableAs = 'button' | 'div' | 'a' | 'span';

interface PressableProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  as?: PressableAs;
  /** Subtle vertical lift on hover. Default true. */
  hoverLift?: boolean;
  /** Tactile scale on press. Default true. */
  pressScale?: number;
  className?: string;
  children: React.ReactNode;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  /** Forwarded to the underlying button (e.g. aria-label, onClick). */
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export const Pressable: React.FC<PressableProps> = ({
  as = 'button',
  hoverLift = true,
  pressScale = 0.97,
  className = '',
  children,
  onClick,
  disabled,
  href,
  type,
  ...rest
}) => {
  const reduced = useReducedMotion();
  // Keep a ref to last interaction so we can detect press-only (no hover on touch)
  const ref = useRef<HTMLElement | null>(null);

  const interactiveProps = reduced
    ? {}
    : {
        whileHover: hoverLift ? { y: -1 } : undefined,
        whileTap: { scale: pressScale },
        transition: { type: 'spring', stiffness: 420, damping: 28 },
      };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    onClick?.(e);
  };

  const motionProps = {
    ref: ref as React.Ref<HTMLElement>,
    onClick: handleClick,
    className: `civic-press-fb ${className}`.trim(),
    'aria-disabled': disabled || undefined,
    ...interactiveProps,
    ...rest,
  };

  if (as === 'a') {
    return (
      <motion.a href={href} {...(motionProps as React.ComponentProps<typeof motion.a>)}>
        {children}
      </motion.a>
    );
  }
  if (as === 'div') {
    return (
      <motion.div {...(motionProps as React.ComponentProps<typeof motion.div>)}>
        {children}
      </motion.div>
    );
  }
  if (as === 'span') {
    return (
      <motion.span {...(motionProps as React.ComponentProps<typeof motion.span>)}>
        {children}
      </motion.span>
    );
  }
  return (
    <motion.button
      type={type ?? 'button'}
      disabled={disabled}
      {...(motionProps as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
};

export default Pressable;
