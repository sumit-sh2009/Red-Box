import React from 'react';
import { motion } from 'motion/react';
import { retroAudio } from '../../utils/retroAudio.js';

export type ButtonVariant = 'accept' | 'reject' | 'resolve' | 'gold' | 'magenta' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface CustomButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const variantClass = {
    accept: 'btn-pixel-accept',
    reject: 'btn-pixel-reject',
    resolve: 'btn-pixel-resolve',
    gold: 'btn-pixel-gold',
    magenta: 'btn-pixel-magenta',
    neutral: 'btn-pixel-neutral',
  }[variant];

  const sizeClass = {
    sm: 'btn-pixel-sm',
    md: '',
    lg: 'btn-pixel-lg',
  }[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === 'accept') {
      retroAudio.playAccept();
    } else if (variant === 'reject') {
      retroAudio.playReject();
    } else if (variant === 'resolve') {
      retroAudio.playVictory();
    } else if (variant === 'gold') {
      retroAudio.playPowerUp();
    } else {
      retroAudio.playClick();
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`pixel-btn ${variantClass} ${sizeClass} ${fullWidth ? 'w-full block' : ''} ${className}`}
      {...props}
    >
      <span className="button_top">
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    </motion.button>
  );
};
