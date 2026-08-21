import React from 'react';
import { Badge } from '../types/index.js';

interface PixelBadgeIconProps {
  badge: Badge;
  size?: number; // e.g. 24, 32, 40
  className?: string;
  dimmed?: boolean;
}

export const PixelBadgeIcon: React.FC<PixelBadgeIconProps> = ({
  badge,
  size = 32,
  className = '',
  dimmed = false,
}) => {
  // Tier color mapping
  const tierBorder = {
    bronze: '#b08968',
    silver: '#8d99ae',
    gold: '#fca311',
    diamond: '#00f0ff',
  }[badge.tier] || '#ffd166';

  const tierGlow = {
    bronze: '#7f4f24',
    silver: '#edf2f4',
    gold: '#ffd166',
    diamond: '#48cae4',
  }[badge.tier] || '#ffd166';

  // SVG Matrix for each badge type
  const renderBadgeMatrix = () => {
    switch (badge.icon) {
      case 'trophy':
        return (
          <g fill={tierGlow}>
            <rect x="3" y="1" width="6" height="5" />
            <rect x="2" y="1" width="1" height="3" fill={tierBorder} />
            <rect x="9" y="1" width="1" height="3" fill={tierBorder} />
            <rect x="4" y="6" width="4" height="2" fill={tierBorder} />
            <rect x="5" y="8" width="2" height="2" />
            <rect x="3" y="10" width="6" height="2" fill="#111118" />
            <rect x="4" y="10" width="4" height="1" fill={tierBorder} />
          </g>
        );

      case 'crown':
        return (
          <g fill={tierGlow}>
            <rect x="2" y="3" width="2" height="6" />
            <rect x="5" y="2" width="2" height="7" fill={tierGlow} />
            <rect x="8" y="3" width="2" height="6" />
            <rect x="2" y="7" width="8" height="3" fill={tierBorder} />
            <rect x="3" y="8" width="6" height="1" fill="#ffffff" />
          </g>
        );

      case 'shield':
        return (
          <g fill={tierGlow}>
            <rect x="2" y="1" width="8" height="2" fill={tierBorder} />
            <rect x="2" y="3" width="8" height="4" />
            <rect x="3" y="7" width="6" height="2" />
            <rect x="4" y="9" width="4" height="2" fill={tierBorder} />
            <rect x="5" y="11" width="2" height="1" fill={tierBorder} />
            <rect x="5" y="4" width="2" height="3" fill="#111118" />
          </g>
        );

      case 'star':
        return (
          <g fill={tierGlow}>
            <rect x="5" y="1" width="2" height="3" />
            <rect x="1" y="4" width="10" height="2" />
            <rect x="3" y="6" width="6" height="2" fill={tierBorder} />
            <rect x="2" y="8" width="3" height="3" />
            <rect x="7" y="8" width="3" height="3" />
          </g>
        );

      case 'rocket':
        return (
          <g fill={tierGlow}>
            <rect x="5" y="1" width="2" height="2" fill="#ef476f" />
            <rect x="4" y="3" width="4" height="5" />
            <rect x="5" y="4" width="2" height="2" fill="#00f0ff" />
            <rect x="2" y="6" width="2" height="3" fill={tierBorder} />
            <rect x="8" y="6" width="2" height="3" fill={tierBorder} />
            <rect x="5" y="8" width="2" height="2" fill="#fb5607" />
            <rect x="5" y="10" width="2" height="2" fill="#ffd166" />
          </g>
        );

      case 'palette':
        return (
          <g fill={tierGlow}>
            <rect x="3" y="1" width="6" height="2" />
            <rect x="2" y="3" width="8" height="6" fill={tierBorder} />
            <rect x="3" y="4" width="2" height="2" fill="#ff006e" />
            <rect x="7" y="4" width="2" height="2" fill="#00f0ff" />
            <rect x="4" y="7" width="2" height="2" fill="#06d6a0" />
            <rect x="7" y="7" width="2" height="2" fill="#ffd166" />
          </g>
        );

      case 'scroll':
        return (
          <g fill={tierGlow}>
            <rect x="2" y="1" width="8" height="2" fill={tierBorder} />
            <rect x="3" y="3" width="6" height="6" />
            <rect x="4" y="4" width="4" height="1" fill="#111118" />
            <rect x="4" y="6" width="4" height="1" fill="#111118" />
            <rect x="2" y="9" width="8" height="2" fill={tierBorder} />
          </g>
        );

      case 'diamond':
        return (
          <g fill={tierGlow}>
            <rect x="4" y="1" width="4" height="2" fill={tierBorder} />
            <rect x="2" y="3" width="8" height="3" />
            <rect x="3" y="6" width="6" height="3" />
            <rect x="4" y="9" width="4" height="2" fill={tierBorder} />
            <rect x="5" y="11" width="2" height="1" />
            <rect x="4" y="3" width="4" height="2" fill="#ffffff" />
          </g>
        );

      case 'crystal':
        return (
          <g fill={tierGlow}>
            <rect x="5" y="1" width="2" height="2" fill="#ffffff" />
            <rect x="4" y="3" width="4" height="5" />
            <rect x="3" y="4" width="6" height="3" fill={tierBorder} />
            <rect x="5" y="8" width="2" height="3" />
            <rect x="5" y="4" width="2" height="2" fill="#ffffff" />
          </g>
        );

      case 'horn':
      default:
        return (
          <g fill={tierGlow}>
            <rect x="2" y="4" width="2" height="4" fill={tierBorder} />
            <rect x="4" y="3" width="3" height="6" />
            <rect x="7" y="2" width="2" height="8" fill={tierBorder} />
            <rect x="9" y="1" width="2" height="10" />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center p-1 bg-retro-card border-2 border-retro-shadow shadow-pixel-sm select-none transition-none ${
        dimmed ? 'opacity-35 grayscale' : 'hover:scale-105'
      } ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: !dimmed ? tierBorder : undefined,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 12 12"
        className="w-full h-full pixel-art"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        {renderBadgeMatrix()}
      </svg>
    </div>
  );
};
