import React from 'react';
import { sound } from '../utils/sound.js';

export type PixelButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'glow';
export type PixelButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
  playSfx?: boolean;
  children: React.ReactNode;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  playSfx = true,
  className = '',
  onClick,
  disabled,
  children,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (playSfx) {
      sound.playClick();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-retro-primary text-white hover:bg-retro-primaryHover border-retro-primary';
      case 'accent':
        return 'bg-retro-accent text-white hover:bg-retro-accentHover border-retro-accent';
      case 'glow':
        return 'bg-retro-primary text-white hover:bg-retro-primaryHover border-retro-primary';
      case 'secondary':
        return 'bg-retro-card text-retro-text border-retro-border hover:border-retro-navy hover:bg-retro-subtle';
      case 'danger':
        return 'bg-retro-danger text-white hover:bg-retro-dangerHover border-retro-danger';
      case 'ghost':
        return 'bg-transparent text-retro-text border-transparent hover:bg-retro-subtle hover:border-retro-border';
      default:
        return 'bg-retro-primary text-white border-retro-primary';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return 'text-[10px] px-2 py-1.5 border';
      case 'sm':
        return 'text-[12px] px-3 py-1.5 border';
      case 'lg':
        return 'text-[14px] px-5 py-2.5 border';
      case 'md':
      default:
        return 'text-[13px] px-4 py-2 border';
    }
  };

  const activeTranslation = variant !== 'ghost'
    ? 'active:translate-x-0.5 active:translate-y-0.5'
    : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`font-body inline-flex items-center justify-center gap-1.5 select-none font-semibold leading-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-colors duration-150 rounded-sm ${getVariantStyles()} ${getSizeStyles()} ${activeTranslation} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
