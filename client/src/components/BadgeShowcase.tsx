import React, { useState } from 'react';
import { Badge } from '../types/index.js';
import { PixelBadgeIcon } from './PixelBadgeIcon.js';
import { PixelIcon } from './PixelIcon.js';
import { sound } from '../utils/sound.js';

interface BadgeShowcaseProps {
  badges: Badge[];
  username: string;
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ badges, username }) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);

  if (!badges || badges.length === 0) return null;

  const earnedCount = badges.filter((b) => b.earned).length;

  const handleBadgeClick = (badge: Badge) => {
    if (badge.earned) {
      sound.playLike();
    } else {
      sound.playClick();
    }
    setSelectedBadge(badge);
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'diamond':
        return 'bg-cyan-500 text-black border-cyan-300 font-bold';
      case 'gold':
        return 'bg-yellow-400 text-black border-yellow-200 font-bold';
      case 'silver':
        return 'bg-slate-300 text-black border-slate-100 font-bold';
      case 'bronze':
      default:
        return 'bg-amber-700 text-white border-amber-500 font-bold';
    }
  };

  return (
    <div className="pixel-box p-3 sm:p-4 flex flex-col gap-2.5 bg-retro-card shadow-pixel-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-retro-border pb-2">
        <div className="flex items-center gap-2">
          <PixelIcon name="sparkles" size={14} color="var(--color-primary)" />
          <span className="font-arcade text-[9.5px] text-retro-text uppercase tracking-wider">
            Civic recognition
          </span>
        </div>
        <span className="font-arcade text-[8px] text-retro-primary bg-retro-subtle px-2 py-0.5 border border-retro-border">
          {earnedCount}/{badges.length} earned
        </span>
      </div>

      {/* Badges Ribbon / Row */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-1 px-1 scrollbar-none">
        {badges.map((badge) => {
          const isHovered = hoveredBadgeId === badge.id;

          return (
            <div
              key={badge.id}
              className="relative shrink-0"
              onMouseEnter={() => setHoveredBadgeId(badge.id)}
              onMouseLeave={() => setHoveredBadgeId(null)}
            >
              <button
                type="button"
                onClick={() => handleBadgeClick(badge)}
                className={`p-1 border-2 transition-all duration-75 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                  badge.earned
                    ? 'border-retro-primary hover:border-retro-accent shadow-pixel-xs bg-retro-subtle'
                    : 'border-retro-border opacity-35 hover:opacity-70 bg-transparent'
                }`}
                title={badge.name}
              >
                <PixelBadgeIcon badge={badge} size={36} dimmed={!badge.earned} />
              </button>

              {/* Pixel-Style Hover Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none min-w-44 max-w-56 p-2.5 bg-retro-card border-3 border-retro-shadow shadow-pixel-md animate-pixel-bounce">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-arcade text-[8.5px] text-retro-text truncate">
                      {badge.name}
                    </span>
                    <span className={`font-arcade text-[6.5px] px-1 border uppercase ${getTierBadgeStyle(badge.tier)}`}>
                      {badge.tier}
                    </span>
                  </div>

                  <p className="font-pixel-body text-xs text-retro-muted leading-tight mb-1.5">
                    {badge.description}
                  </p>

                  <div className="font-arcade text-[7.5px] flex items-center justify-between border-t border-retro-border pt-1">
                    <span className={badge.earned ? 'text-retro-success' : 'text-retro-muted'}>
                      {badge.earned ? 'Earned' : 'Not yet'}
                    </span>
                    {badge.progress && (
                      <span className="font-terminal text-xs text-retro-text">{badge.progress.label}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Badge Milestone Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-retro-card border-4 border-retro-shadow shadow-pixel-lg max-w-sm w-full p-5 flex flex-col items-center text-center gap-3 animate-pixel-bounce">
            <div className="p-3 bg-retro-subtle border-3 border-retro-shadow">
              <PixelBadgeIcon badge={selectedBadge} size={64} dimmed={!selectedBadge.earned} />
            </div>

            <div className="flex items-center gap-2">
              <h3 className="font-arcade text-xs text-retro-text">
                {selectedBadge.name}
              </h3>
              <span className={`font-arcade text-[7.5px] px-1.5 py-0.5 border uppercase ${getTierBadgeStyle(selectedBadge.tier)}`}>
                {selectedBadge.tier}
              </span>
            </div>

            <p className="font-pixel-body text-sm text-retro-muted leading-relaxed px-2">
              {selectedBadge.description}
            </p>

            <div className="w-full p-2.5 bg-retro-subtle border-2 border-retro-border flex flex-col gap-1 text-left">
              <div className="flex justify-between font-arcade text-[8px]">
                <span className="text-retro-muted uppercase">Status:</span>
                <span className={selectedBadge.earned ? 'text-retro-success font-bold' : 'text-retro-muted font-bold'}>
                  {selectedBadge.earned ? 'Earned' : 'In progress'}
                </span>
              </div>
              {selectedBadge.progress && (
                <div className="flex justify-between font-arcade text-[8px]">
                  <span className="text-retro-muted uppercase">Requirement:</span>
                  <span className="font-terminal text-sm text-retro-primary font-bold">{selectedBadge.progress.label}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2 bg-retro-primary text-black font-arcade text-[9px] border-2 border-retro-shadow shadow-pixel-sm active:translate-x-0.5 active:translate-y-0.5 uppercase mt-1 cursor-pointer font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
