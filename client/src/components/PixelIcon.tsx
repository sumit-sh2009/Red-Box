import React from 'react';

export type PixelIconName =
  | 'home'
  | 'search'
  | 'bell'
  | 'user'
  | 'heart'
  | 'heart-filled'
  | 'reply'
  | 'repost'
  | 'share'
  | 'image'
  | 'brush'
  | 'palette'
  | 'trash'
  | 'sparkles'
  | 'audio'
  | 'audio-muted'
  | 'settings'
  | 'close'
  | 'check'
  | 'arrow-left'
  | 'badge-verified'
  | 'crt'
  | 'plus'
  | 'dots'
  | 'bookmark'
  | 'bookmark-filled'
  | 'flame'
  | 'shield'
  | 'trophy'
  | 'edit'
  | 'zap'
  | 'copy'
  | 'eye'
  | 'building'
  | 'flag'
  | 'terminal';

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  className?: string;
  color?: string;
}

const SHADE = 'rgba(0, 0, 0, 0.22)';

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 20,
  className = '',
  color = 'currentColor',
}) => {
  const renderPaths = () => {
    switch (name) {
      case 'home':
        // 16x16 pixel house with door & window
        return (
          <>
            <rect x="7" y="1" width="2" height="1" fill={color} />
            <rect x="5" y="2" width="6" height="1" fill={color} />
            <rect x="3" y="3" width="10" height="1" fill={color} />
            <rect x="2" y="4" width="12" height="1" fill={color} />
            <rect x="2" y="5" width="12" height="10" fill={color} />
            <rect x="6" y="10" width="4" height="5" fill="var(--color-bg)" />
            <rect x="9" y="6" width="3" height="3" fill="var(--color-bg)" />
          </>
        );

      case 'search':
        // 16x16 magnifying glass with 2px ring & handle
        return (
          <>
            <rect x="4" y="3" width="8" height="1" fill={color} />
            <rect x="3" y="4" width="1" height="6" fill={color} />
            <rect x="12" y="4" width="1" height="6" fill={color} />
            <rect x="4" y="10" width="8" height="1" fill={color} />
            <rect x="4" y="4" width="1" height="1" fill={color} />
            <rect x="11" y="4" width="1" height="1" fill={color} />
            <rect x="4" y="9" width="1" height="1" fill={color} />
            <rect x="11" y="9" width="1" height="1" fill={color} />
            <rect x="5" y="5" width="6" height="4" fill={color} />
            <rect x="6" y="6" width="4" height="2" fill="var(--color-bg)" />
            <rect x="10" y="10" width="3" height="3" fill={color} />
            <rect x="12" y="12" width="2" height="2" fill={color} />
          </>
        );

      case 'bell':
        // 16x16 notification bell with clapper
        return (
          <>
            <rect x="7" y="2" width="2" height="1" fill={color} />
            <rect x="6" y="3" width="4" height="1" fill={color} />
            <rect x="5" y="4" width="6" height="2" fill={color} />
            <rect x="4" y="6" width="8" height="3" fill={color} />
            <rect x="3" y="9" width="10" height="2" fill={color} />
            <rect x="2" y="11" width="12" height="1" fill={color} />
            <rect x="6" y="12" width="4" height="2" fill={color} />
            <rect x="7" y="14" width="2" height="1" fill={color} />
          </>
        );

      case 'user':
        // 16x16 player silhouette
        return (
          <>
            <rect x="6" y="2" width="4" height="1" fill={color} />
            <rect x="5" y="3" width="6" height="1" fill={color} />
            <rect x="6" y="4" width="4" height="2" fill={color} />
            <rect x="4" y="7" width="8" height="1" fill={color} />
            <rect x="3" y="8" width="10" height="1" fill={color} />
            <rect x="2" y="9" width="12" height="1" fill={color} />
            <rect x="1" y="10" width="14" height="2" fill={color} />
            <rect x="2" y="12" width="12" height="1" fill={color} />
            <rect x="3" y="13" width="10" height="1" fill={color} />
          </>
        );

      case 'heart':
        // 16x16 pixel heart outline (2px stroke, top notch)
        return (
          <>
            <rect x="3" y="3" width="4" height="1" fill={color} />
            <rect x="9" y="3" width="4" height="1" fill={color} />
            <rect x="2" y="4" width="1" height="3" fill={color} />
            <rect x="7" y="4" width="2" height="2" fill={color} />
            <rect x="13" y="4" width="1" height="3" fill={color} />
            <rect x="3" y="7" width="1" height="2" fill={color} />
            <rect x="12" y="7" width="1" height="2" fill={color} />
            <rect x="4" y="9" width="2" height="1" fill={color} />
            <rect x="10" y="9" width="2" height="1" fill={color} />
            <rect x="6" y="10" width="4" height="2" fill={color} />
            <rect x="7" y="12" width="2" height="2" fill={color} />
          </>
        );

      case 'heart-filled':
        // 16x16 solid pixel heart with bottom-right shading
        return (
          <>
            <rect x="3" y="3" width="4" height="1" fill={color} />
            <rect x="9" y="3" width="4" height="1" fill={color} />
            <rect x="2" y="4" width="12" height="3" fill={color} />
            <rect x="3" y="7" width="10" height="2" fill={color} />
            <rect x="4" y="9" width="8" height="2" fill={color} />
            <rect x="6" y="11" width="4" height="2" fill={color} />
            <rect x="7" y="13" width="2" height="1" fill={color} />
            <rect x="11" y="4" width="3" height="1" fill={SHADE} />
            <rect x="12" y="5" width="2" height="1" fill={SHADE} />
            <rect x="11" y="7" width="2" height="1" fill={SHADE} />
            <rect x="10" y="9" width="2" height="1" fill={SHADE} />
            <rect x="9" y="10" width="1" height="1" fill={SHADE} />
            <rect x="8" y="11" width="1" height="1" fill={SHADE} />
          </>
        );

      case 'reply':
        // 16x16 speech bubble with tail
        return (
          <>
            <rect x="3" y="2" width="10" height="1" fill={color} />
            <rect x="2" y="3" width="12" height="7" fill={color} />
            <rect x="3" y="10" width="10" height="1" fill={color} />
            <rect x="4" y="11" width="3" height="1" fill={color} />
            <rect x="3" y="12" width="2" height="1" fill={color} />
            <rect x="2" y="13" width="2" height="1" fill={color} />
            <rect x="4" y="4" width="8" height="5" fill="var(--color-card)" />
            <rect x="5" y="6" width="6" height="1" fill={color} />
          </>
        );

      case 'repost':
        // 16x16 dual pixel loop arrows
        return (
          <>
            {/* Top right arrow */}
            <rect x="9" y="1" width="2" height="4" fill={color} />
            <rect x="11" y="2" width="2" height="2" fill={color} />
            <rect x="13" y="3" width="2" height="1" fill={color} />
            <rect x="4" y="3" width="6" height="2" fill={color} />
            <rect x="2" y="5" width="2" height="4" fill={color} />

            {/* Bottom left arrow */}
            <rect x="5" y="11" width="2" height="4" fill={color} />
            <rect x="3" y="12" width="2" height="2" fill={color} />
            <rect x="1" y="12" width="2" height="1" fill={color} />
            <rect x="6" y="11" width="6" height="2" fill={color} />
            <rect x="12" y="7" width="2" height="4" fill={color} />
          </>
        );

      case 'share':
        // 16x16 up-arrow leaving a tray (share)
        return (
          <>
            <rect x="7" y="1" width="2" height="7" fill={color} />
            <rect x="6" y="2" width="1" height="2" fill={color} />
            <rect x="9" y="2" width="1" height="2" fill={color} />
            <rect x="5" y="3" width="1" height="1" fill={color} />
            <rect x="10" y="3" width="1" height="1" fill={color} />
            <rect x="2" y="8" width="2" height="6" fill={color} />
            <rect x="12" y="8" width="2" height="6" fill={color} />
            <rect x="2" y="13" width="12" height="2" fill={color} />
          </>
        );

      case 'image':
        // 16x16 photo frame with sun & mountains
        return (
          <>
            <rect x="2" y="2" width="12" height="12" fill={color} />
            <rect x="3" y="3" width="10" height="10" fill="var(--color-bg)" />
            <rect x="10" y="4" width="2" height="2" fill={color} />
            <rect x="4" y="10" width="3" height="3" fill={color} />
            <rect x="5" y="8" width="2" height="2" fill={color} />
            <rect x="8" y="9" width="4" height="4" fill={color} />
            <rect x="9" y="7" width="2" height="2" fill={color} />
          </>
        );

      case 'brush':
        // 16x16 diagonal paintbrush
        return (
          <>
            <rect x="11" y="2" width="3" height="2" fill="#ff006e" />
            <rect x="10" y="3" width="2" height="2" fill="#fca311" />
            <rect x="12" y="4" width="1" height="1" fill="#ff006e" />
            <rect x="8" y="6" width="3" height="2" fill="#48cae4" />
            <rect x="6" y="8" width="3" height="2" fill={color} />
            <rect x="4" y="10" width="3" height="2" fill={color} />
            <rect x="2" y="12" width="3" height="3" fill={color} />
          </>
        );

      case 'palette':
        // 16x16 artist palette with thumb hole
        return (
          <>
            <rect x="4" y="2" width="8" height="2" fill={color} />
            <rect x="2" y="4" width="12" height="8" fill={color} />
            <rect x="4" y="12" width="8" height="2" fill={color} />
            <rect x="6" y="6" width="2" height="2" fill="var(--color-bg)" />
            <rect x="4" y="5" width="1" height="1" fill="#ff4d6d" />
            <rect x="10" y="5" width="1" height="1" fill="#fca311" />
            <rect x="5" y="9" width="1" height="1" fill="#48cae4" />
            <rect x="9" y="9" width="1" height="1" fill="#06d6a0" />
            <rect x="7" y="10" width="1" height="1" fill="#ffd166" />
          </>
        );

      case 'trash':
        // 16x16 trash can with lid & vents
        return (
          <>
            <rect x="6" y="2" width="4" height="1" fill={color} />
            <rect x="3" y="3" width="10" height="2" fill={color} />
            <rect x="4" y="5" width="8" height="9" fill={color} />
            <rect x="6" y="7" width="1" height="5" fill="var(--color-bg)" />
            <rect x="9" y="7" width="1" height="5" fill="var(--color-bg)" />
          </>
        );

      case 'sparkles':
        // 16x16 pixel star sparkle with corner glint
        return (
          <>
            <rect x="7" y="2" width="2" height="12" fill={color} />
            <rect x="2" y="7" width="12" height="2" fill={color} />
            <rect x="5" y="5" width="6" height="6" fill={color} />
            <rect x="12" y="1" width="1" height="3" fill={color} />
            <rect x="11" y="2" width="3" height="1" fill={color} />
            <rect x="3" y="12" width="2" height="1" fill={color} />
            <rect x="4" y="13" width="1" height="1" fill={color} />
          </>
        );

      case 'audio':
        // 16x16 speaker with sound waves
        return (
          <>
            <rect x="2" y="6" width="3" height="4" fill={color} />
            <rect x="5" y="4" width="3" height="8" fill={color} />
            <rect x="10" y="5" width="1" height="6" fill={color} />
            <rect x="12" y="3" width="1" height="10" fill={color} />
            <rect x="14" y="5" width="1" height="6" fill={color} />
          </>
        );

      case 'audio-muted':
        // 16x16 speaker with X
        return (
          <>
            <rect x="2" y="6" width="3" height="4" fill={color} />
            <rect x="5" y="4" width="3" height="8" fill={color} />
            <rect x="10" y="6" width="1" height="1" fill="#ff4d6d" />
            <rect x="12" y="6" width="1" height="1" fill="#ff4d6d" />
            <rect x="11" y="7" width="1" height="1" fill="#ff4d6d" />
            <rect x="10" y="8" width="1" height="1" fill="#ff4d6d" />
            <rect x="12" y="8" width="1" height="1" fill="#ff4d6d" />
            <rect x="11" y="9" width="1" height="1" fill="#ff4d6d" />
          </>
        );

      case 'settings':
        // 16x16 pixel gear with four teeth
        return (
          <>
            <rect x="6" y="1" width="4" height="2" fill={color} />
            <rect x="1" y="6" width="2" height="4" fill={color} />
            <rect x="13" y="6" width="2" height="4" fill={color} />
            <rect x="6" y="13" width="4" height="2" fill={color} />
            <rect x="4" y="3" width="8" height="10" fill={color} />
            <rect x="6" y="6" width="4" height="4" fill="var(--color-bg)" />
          </>
        );

      case 'close':
        // 16x16 pixel cross
        return (
          <>
            <rect x="3" y="3" width="2" height="2" fill={color} />
            <rect x="5" y="5" width="2" height="2" fill={color} />
            <rect x="7" y="7" width="2" height="2" fill={color} />
            <rect x="9" y="5" width="2" height="2" fill={color} />
            <rect x="11" y="3" width="2" height="2" fill={color} />
            <rect x="5" y="9" width="2" height="2" fill={color} />
            <rect x="3" y="11" width="2" height="2" fill={color} />
            <rect x="9" y="9" width="2" height="2" fill={color} />
            <rect x="11" y="11" width="2" height="2" fill={color} />
          </>
        );

      case 'check':
        // 16x16 pixel checkmark
        return (
          <>
            <rect x="3" y="8" width="2" height="2" fill={color} />
            <rect x="5" y="10" width="2" height="2" fill={color} />
            <rect x="7" y="12" width="2" height="2" fill={color} />
            <rect x="9" y="9" width="2" height="3" fill={color} />
            <rect x="11" y="6" width="2" height="3" fill={color} />
            <rect x="13" y="3" width="2" height="3" fill={color} />
          </>
        );

      case 'arrow-left':
        // 16x16 pixel left arrow
        return (
          <>
            <rect x="7" y="3" width="2" height="2" fill={color} />
            <rect x="5" y="5" width="2" height="2" fill={color} />
            <rect x="3" y="7" width="11" height="2" fill={color} />
            <rect x="5" y="9" width="2" height="2" fill={color} />
            <rect x="7" y="11" width="2" height="2" fill={color} />
          </>
        );

      case 'badge-verified':
        // 16x16 pixel verified badge with check
        return (
          <>
            <rect x="4" y="2" width="8" height="12" fill="var(--color-primary)" />
            <rect x="2" y="4" width="12" height="8" fill="var(--color-primary)" />
            <rect x="5" y="8" width="2" height="2" fill="#000" />
            <rect x="7" y="10" width="2" height="2" fill="#000" />
            <rect x="9" y="6" width="2" height="4" fill="#000" />
          </>
        );

      case 'crt':
        // 16x16 pixel retro monitor
        return (
          <>
            <rect x="2" y="2" width="12" height="10" fill={color} />
            <rect x="3" y="3" width="10" height="8" fill="var(--color-bg)" />
            <rect x="6" y="12" width="4" height="2" fill={color} />
            <rect x="4" y="14" width="8" height="1" fill={color} />
            <rect x="4" y="5" width="2" height="1" fill={color} />
          </>
        );

      case 'plus':
        // 16x16 pixel plus
        return (
          <>
            <rect x="7" y="2" width="2" height="12" fill={color} />
            <rect x="2" y="7" width="12" height="2" fill={color} />
          </>
        );

      case 'dots':
        // 16x16 triple pixel dots
        return (
          <>
            <rect x="3" y="7" width="2" height="2" fill={color} />
            <rect x="7" y="7" width="2" height="2" fill={color} />
            <rect x="11" y="7" width="2" height="2" fill={color} />
          </>
        );

      case 'bookmark':
        // 16x16 bookmark outline with pointed tail
        return (
          <>
            <rect x="4" y="2" width="8" height="1" fill={color} />
            <rect x="3" y="3" width="1" height="9" fill={color} />
            <rect x="12" y="3" width="1" height="9" fill={color} />
            <rect x="4" y="12" width="2" height="1" fill={color} />
            <rect x="10" y="12" width="2" height="1" fill={color} />
            <rect x="6" y="13" width="2" height="1" fill={color} />
            <rect x="8" y="13" width="2" height="1" fill={color} />
            <rect x="7" y="14" width="2" height="1" fill={color} />
            <rect x="4" y="4" width="2" height="1" fill={color} />
            <rect x="10" y="4" width="2" height="1" fill={color} />
          </>
        );

      case 'bookmark-filled':
        // 16x16 solid bookmark
        return (
          <>
            <rect x="3" y="2" width="10" height="11" fill={color} />
            <rect x="4" y="3" width="8" height="10" fill={color} />
            <rect x="6" y="13" width="4" height="1" fill={color} />
            <rect x="7" y="14" width="2" height="1" fill={color} />
            <rect x="8" y="4" width="2" height="2" fill={SHADE} />
            <rect x="9" y="6" width="2" height="2" fill={SHADE} />
            <rect x="8" y="8" width="2" height="2" fill={SHADE} />
            <rect x="9" y="10" width="2" height="2" fill={SHADE} />
          </>
        );

      case 'flame':
        // 16x16 pixel flame
        return (
          <>
            <rect x="7" y="1" width="2" height="2" fill={color} />
            <rect x="6" y="3" width="4" height="2" fill={color} />
            <rect x="5" y="5" width="6" height="2" fill={color} />
            <rect x="5" y="7" width="2" height="3" fill={color} />
            <rect x="9" y="7" width="2" height="3" fill={color} />
            <rect x="4" y="8" width="8" height="2" fill={color} />
            <rect x="3" y="10" width="10" height="2" fill={color} />
            <rect x="3" y="12" width="10" height="2" fill={color} />
            <rect x="4" y="14" width="8" height="1" fill={color} />
          </>
        );

      case 'shield':
        // 16x16 pixel shield with check
        return (
          <>
            <rect x="4" y="2" width="8" height="2" fill={color} />
            <rect x="3" y="4" width="10" height="2" fill={color} />
            <rect x="2" y="6" width="12" height="4" fill={color} />
            <rect x="3" y="10" width="10" height="2" fill={color} />
            <rect x="4" y="12" width="8" height="2" fill={color} />
            <rect x="6" y="14" width="4" height="1" fill={color} />
            <rect x="5" y="8" width="2" height="2" fill="var(--color-bg)" />
            <rect x="7" y="10" width="2" height="2" fill="var(--color-bg)" />
            <rect x="9" y="7" width="2" height="2" fill="var(--color-bg)" />
          </>
        );

      case 'trophy':
        // 16x16 pixel trophy cup
        return (
          <>
            <rect x="5" y="2" width="6" height="2" fill={color} />
            <rect x="4" y="4" width="8" height="2" fill={color} />
            <rect x="3" y="6" width="10" height="3" fill={color} />
            <rect x="4" y="9" width="8" height="2" fill={color} />
            <rect x="2" y="4" width="2" height="4" fill={color} />
            <rect x="12" y="4" width="2" height="4" fill={color} />
            <rect x="6" y="11" width="4" height="2" fill={color} />
            <rect x="4" y="13" width="8" height="1" fill={color} />
            <rect x="5" y="14" width="6" height="1" fill={color} />
            <rect x="5" y="7" width="2" height="2" fill={SHADE} />
            <rect x="9" y="7" width="2" height="2" fill={SHADE} />
          </>
        );

      case 'edit':
        // 16x16 diagonal pencil
        return (
          <>
            <rect x="12" y="2" width="2" height="2" fill={color} />
            <rect x="10" y="4" width="2" height="2" fill={color} />
            <rect x="8" y="6" width="2" height="2" fill={color} />
            <rect x="6" y="8" width="2" height="2" fill={color} />
            <rect x="4" y="10" width="2" height="2" fill={color} />
            <rect x="2" y="12" width="2" height="2" fill={color} />
            <rect x="2" y="14" width="2" height="1" fill={color} />
            <rect x="14" y="2" width="1" height="2" fill={color} />
            <rect x="4" y="13" width="1" height="2" fill={color} />
          </>
        );

      case 'zap':
        // 16x16 lightning bolt
        return (
          <>
            <rect x="9" y="1" width="2" height="3" fill={color} />
            <rect x="7" y="4" width="4" height="3" fill={color} />
            <rect x="5" y="7" width="6" height="3" fill={color} />
            <rect x="3" y="10" width="6" height="3" fill={color} />
            <rect x="2" y="13" width="4" height="2" fill={color} />
            <rect x="6" y="13" width="4" height="2" fill={color} />
          </>
        );

      case 'copy':
        // 16x16 two overlapping squares
        return (
          <>
            <rect x="6" y="2" width="8" height="1" fill={color} />
            <rect x="6" y="3" width="1" height="6" fill={color} />
            <rect x="13" y="3" width="1" height="6" fill={color} />
            <rect x="6" y="9" width="8" height="1" fill={color} />
            <rect x="2" y="5" width="8" height="1" fill={color} />
            <rect x="2" y="6" width="1" height="6" fill={color} />
            <rect x="9" y="6" width="1" height="6" fill={color} />
            <rect x="2" y="12" width="8" height="1" fill={color} />
          </>
        );

      case 'eye':
        // 16x16 pixel eye with pupil
        return (
          <>
            <rect x="3" y="4" width="10" height="1" fill={color} />
            <rect x="2" y="5" width="12" height="1" fill={color} />
            <rect x="1" y="6" width="14" height="4" fill={color} />
            <rect x="2" y="10" width="12" height="1" fill={color} />
            <rect x="3" y="11" width="10" height="1" fill={color} />
            <rect x="5" y="7" width="6" height="2" fill={color} />
            <rect x="7" y="8" width="2" height="2" fill="var(--color-bg)" />
          </>
        );

      case 'building':
        // 16x16 neoclassical / municipal building with columns
        return (
          <>
            <rect x="7" y="1" width="2" height="1" fill={color} />
            <rect x="5" y="2" width="6" height="1" fill={color} />
            <rect x="3" y="3" width="10" height="1" fill={color} />
            <rect x="1" y="4" width="14" height="2" fill={color} />
            {/* Columns */}
            <rect x="2" y="6" width="2" height="7" fill={color} />
            <rect x="5" y="6" width="2" height="7" fill={color} />
            <rect x="9" y="6" width="2" height="7" fill={color} />
            <rect x="12" y="6" width="2" height="7" fill={color} />
            {/* Base steps */}
            <rect x="1" y="13" width="14" height="1" fill={color} />
            <rect x="0" y="14" width="16" height="2" fill={color} />
          </>
        );

      case 'flag':
        // 16x16 pixel flag on pole
        return (
          <>
            <rect x="2" y="1" width="2" height="14" fill={color} />
            <rect x="1" y="14" width="4" height="2" fill={color} />
            <rect x="4" y="2" width="9" height="6" fill={color} />
            <rect x="5" y="3" width="7" height="4" fill="var(--color-bg)" />
            <rect x="6" y="4" width="5" height="2" fill={color} />
          </>
        );

      case 'terminal':
        // 16x16 pixel command prompt terminal
        return (
          <>
            <rect x="1" y="2" width="14" height="12" fill={color} />
            <rect x="2" y="3" width="12" height="10" fill="var(--color-bg)" />
            <rect x="4" y="5" width="2" height="2" fill={color} />
            <rect x="6" y="7" width="2" height="2" fill={color} />
            <rect x="4" y="9" width="2" height="2" fill={color} />
            <rect x="9" y="10" width="3" height="2" fill={color} />
          </>
        );

      default:
        return <rect x="2" y="2" width="12" height="12" fill={color} />;
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`pixel-art shrink-0 inline-block ${className}`}
      style={{
        imageRendering: 'pixelated',
        shapeRendering: 'crispEdges',
      }}
    >
      {renderPaths()}
    </svg>
  );
};