import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { sound } from '../utils/sound.js';

interface PixelDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  gridSize?: number; // 16 or 24
}

const PALETTE = [
  '#000000', '#ffffff', '#e63946', '#ff006e',
  '#fb5607', '#ffbe0b', '#2ec4b6', '#38b000',
  '#0077b6', '#4cc9f0', '#7209b7', '#8338ec',
  '#540b0e', '#7f4f24', '#8d99ae', '#2b2d42',
];

export const PixelDrawModal: React.FC<PixelDrawModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Pixel Art Studio',
  gridSize = 16,
}) => {
  const [pixels, setPixels] = useState<string[]>(() =>
    Array(gridSize * gridSize).fill('transparent')
  );
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[2]); // red default
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Reset grid on open
      setPixels(Array(gridSize * gridSize).fill('transparent'));
    }
  }, [isOpen, gridSize]);

  const drawPixel = useCallback(
    (index: number) => {
      sound.playClick();
      setPixels((prev) => {
        const next = [...prev];
        if (tool === 'eraser') {
          next[index] = 'transparent';
        } else if (tool === 'brush') {
          next[index] = selectedColor;
        } else if (tool === 'fill') {
          const targetColor = prev[index];
          if (targetColor === selectedColor) return prev;

          const queue = [index];
          const visited = new Set<number>();

          while (queue.length > 0) {
            const curr = queue.pop()!;
            if (visited.has(curr)) continue;
            visited.add(curr);

            if (next[curr] === targetColor) {
              next[curr] = selectedColor;
              const x = curr % gridSize;
              const y = Math.floor(curr / gridSize);

              if (x > 0) queue.push(curr - 1);
              if (x < gridSize - 1) queue.push(curr + 1);
              if (y > 0) queue.push(curr - gridSize);
              if (y < gridSize - 1) queue.push(curr + gridSize);
            }
          }
        }
        return next;
      });
    },
    [tool, selectedColor, gridSize]
  );

  const handleExport = () => {
    sound.playNotification();
    // Render pixels onto a high-res hidden canvas for crisp export
    const scale = 20; // 16x20 = 320x320px
    const canvas = document.createElement('canvas');
    canvas.width = gridSize * scale;
    canvas.height = gridSize * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background transparent or subtle
    ctx.imageSmoothingEnabled = false;

    pixels.forEach((color, i) => {
      if (color !== 'transparent') {
        const x = (i % gridSize) * scale;
        const y = Math.floor(i / gridSize) * scale;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, scale, scale);
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-retro-card border-4 border-retro-shadow shadow-pixel-lg max-w-md w-full p-5 flex flex-col gap-4 animate-pixel-bounce">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-retro-border pb-3">
          <div className="flex items-center gap-2">
            <PixelIcon name="palette" size={20} color="var(--color-primary)" />
            <h2 className="font-pixel text-xs sm:text-sm text-retro-text tracking-wide">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-retro-muted hover:text-retro-text p-1 border-2 border-transparent hover:border-retro-border"
          >
            <PixelIcon name="close" size={16} />
          </button>
        </div>

        {/* Tools Bar */}
        <div className="flex items-center gap-2 justify-between bg-retro-subtle p-2 border-2 border-retro-border">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setTool('brush');
                sound.playClick();
              }}
              className={`font-pixel text-[9px] px-2.5 py-1 border-2 select-none ${
                tool === 'brush'
                  ? 'bg-retro-primary text-black border-retro-shadow font-bold'
                  : 'bg-retro-card text-retro-text border-retro-border'
              }`}
            >
              BRUSH
            </button>
            <button
              onClick={() => {
                setTool('eraser');
                sound.playClick();
              }}
              className={`font-pixel text-[9px] px-2.5 py-1 border-2 select-none ${
                tool === 'eraser'
                  ? 'bg-retro-danger text-white border-retro-shadow font-bold'
                  : 'bg-retro-card text-retro-text border-retro-border'
              }`}
            >
              ERASER
            </button>
            <button
              onClick={() => {
                setTool('fill');
                sound.playClick();
              }}
              className={`font-pixel text-[9px] px-2.5 py-1 border-2 select-none ${
                tool === 'fill'
                  ? 'bg-retro-accent text-black border-retro-shadow font-bold'
                  : 'bg-retro-card text-retro-text border-retro-border'
              }`}
            >
              FILL
            </button>
          </div>

          <button
            onClick={() => {
              setPixels(Array(gridSize * gridSize).fill('transparent'));
              sound.playDelete();
            }}
            className="font-pixel text-[8px] text-retro-muted hover:text-retro-danger uppercase"
          >
            Clear Grid
          </button>
        </div>

        {/* Drawing Canvas Matrix */}
        <div className="flex justify-center p-2 bg-retro-bg border-3 border-retro-shadow">
          <div
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
            className="grid select-none cursor-crosshair border border-retro-border"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              width: '288px',
              height: '288px',
            }}
          >
            {pixels.map((color, i) => (
              <div
                key={i}
                onMouseDown={() => drawPixel(i)}
                onMouseEnter={() => {
                  if (isMouseDown && tool !== 'fill') {
                    drawPixel(i);
                  }
                }}
                className="border-[0.5px] border-retro-border/30 hover:opacity-80"
                style={{
                  backgroundColor: color === 'transparent' ? 'rgba(255,255,255,0.03)' : color,
                }}
              />
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex flex-col gap-1.5">
          <div className="font-pixel text-[9px] text-retro-muted uppercase">Palette</div>
          <div className="grid grid-cols-8 gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedColor(c);
                  if (tool === 'eraser') setTool('brush');
                  sound.playClick();
                }}
                className={`h-7 border-2 transition-none select-none ${
                  selectedColor === c && tool !== 'eraser'
                    ? 'border-retro-primary scale-110 shadow-pixel-sm z-10'
                    : 'border-retro-shadow'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-retro-border">
          <PixelButton variant="secondary" size="md" onClick={onClose}>
            CANCEL
          </PixelButton>
          <PixelButton variant="primary" size="md" onClick={handleExport}>
            ATTACH ART
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
