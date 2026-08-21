import React, { useMemo } from 'react';
import { getAvatarById } from '../utils/avatars.js';
import { isCustomAvatarString, decodeAvatarConfig, generateCompositeMatrix } from '../utils/avatarBuilder.js';

interface PixelAvatarProps {
  avatarId?: string;
  size?: number; // e.g. 24, 32, 40, 48, 64, 80
  className?: string;
  borderColor?: string;
  showBorder?: boolean;
  interactive?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  avatarId = 'knight',
  size = 40,
  className = '',
  borderColor,
  showBorder = true,
  interactive = false,
  animate = true,
  onClick,
}) => {
  const isDataUrl = avatarId?.startsWith('data:image/');
  const isCustom = isCustomAvatarString(avatarId);

  // Deterministic animation delay based on avatar ID so avatars in the feed don't all bob at the exact same millisecond
  const animDelay = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < avatarId.length; i++) {
      hash = (hash << 5) - hash + avatarId.charCodeAt(i);
      hash |= 0;
    }
    const delay = (Math.abs(hash) % 20) / 10; // 0.0s - 1.9s
    return `${delay.toFixed(1)}s`;
  }, [avatarId]);

  const borderClasses = showBorder
    ? 'border-2 border-retro-shadow shadow-pixel-sm'
    : '';

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-retro-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
    : '';

  // 1. Data URL (Canvas Drawings & Uploaded Pixel Art)
  if (isDataUrl) {
    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center bg-retro-bg overflow-hidden shrink-0 select-none ${borderClasses} ${interactiveClasses} ${className}`}
        style={{
          width: size,
          height: size,
          borderColor: borderColor,
        }}
      >
        <img
          src={avatarId}
          alt="Pixel avatar"
          className={`w-full h-full object-cover pixel-art ${animate ? 'animate-sprite-bob' : ''}`}
          style={{
            imageRendering: 'pixelated',
            animationDelay: animDelay,
          }}
        />
      </div>
    );
  }

  // 2. Custom Built Modular Sprite (custom_v1:skin:hair:color:outfit:ocolor:acc)
  if (isCustom) {
    const config = decodeAvatarConfig(avatarId);
    const pixels = generateCompositeMatrix(config);

    return (
      <div
        onClick={onClick}
        className={`relative inline-flex items-center justify-center bg-retro-bg overflow-hidden shrink-0 select-none ${borderClasses} ${interactiveClasses} ${className}`}
        style={{
          width: size,
          height: size,
          borderColor: borderColor,
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
          <g
            className={animate ? 'animate-sprite-bob' : ''}
            style={{
              transformOrigin: 'bottom center',
              animationDelay: animDelay,
            }}
          >
            {pixels.map((p, idx) => {
              if (p.isEyeOpen) {
                return (
                  <rect
                    key={`eye-open-${p.x}-${p.y}-${idx}`}
                    x={p.x}
                    y={p.y}
                    width="1"
                    height="1"
                    fill={p.color}
                    className={animate ? 'sprite-eye-open' : ''}
                    style={{ animationDelay: animDelay }}
                    shapeRendering="crispEdges"
                  />
                );
              }
              if (p.isEyeClosed) {
                return (
                  <rect
                    key={`eye-closed-${p.x}-${p.y}-${idx}`}
                    x={p.x}
                    y={p.y}
                    width="1"
                    height="1"
                    fill={p.color}
                    className={animate ? 'sprite-eye-closed' : 'hidden'}
                    style={{ animationDelay: animDelay }}
                    shapeRendering="crispEdges"
                  />
                );
              }
              return (
                <rect
                  key={`${p.x}-${p.y}-${idx}`}
                  x={p.x}
                  y={p.y}
                  width="1"
                  height="1"
                  fill={p.color}
                  shapeRendering="crispEdges"
                />
              );
            })}
          </g>
        </svg>
      </div>
    );
  }

  // 3. Preset Pixel Art Sprite with Stepped Blink & Idle Bob
  const sprite = getAvatarById(avatarId);
  const height = sprite.matrix.length;
  const width = sprite.matrix[0].length;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center bg-retro-bg overflow-hidden shrink-0 select-none ${borderClasses} ${interactiveClasses} ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: borderColor,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full pixel-art"
        style={{
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
        }}
      >
        <g
          className={animate ? 'animate-sprite-bob' : ''}
          style={{
            transformOrigin: 'bottom center',
            animationDelay: animDelay,
          }}
        >
          {sprite.matrix.map((row, y) =>
            row.split('').map((char, x) => {
              if (char === '.') return null;
              const colorIndex = parseInt(char, 10);
              const color = sprite.colors[colorIndex] || '#000000';

              // Detect eyes in preset sprites (e.g. eyes at rows 4-6) to add stepped blink
              const isEyePixel =
                (y === 4 || y === 5 || y === 6) &&
                (char === '0' || (char === '3' && (sprite.id === 'cat' || sprite.id === 'robot' || sprite.id === 'corgi')));

              if (isEyePixel && animate) {
                // Secondary eyelid color is the surrounding face/helmet color (index 2 or 1)
                const eyelidColor = sprite.colors[2] || sprite.colors[1] || '#8d99ae';
                return (
                  <React.Fragment key={`${x}-${y}`}>
                    {/* Open Eye Frame */}
                    <rect
                      x={x}
                      y={y}
                      width="1"
                      height="1"
                      fill={color}
                      className="sprite-eye-open"
                      style={{ animationDelay: animDelay }}
                      shapeRendering="crispEdges"
                    />
                    {/* Closed Eyelid Frame */}
                    <rect
                      x={x}
                      y={y}
                      width="1"
                      height="1"
                      fill={eyelidColor}
                      className="sprite-eye-closed"
                      style={{ animationDelay: animDelay }}
                      shapeRendering="crispEdges"
                    />
                  </React.Fragment>
                );
              }

              return (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="1"
                  height="1"
                  fill={color}
                  shapeRendering="crispEdges"
                />
              );
            })
          )}
        </g>
      </svg>
    </div>
  );
};
