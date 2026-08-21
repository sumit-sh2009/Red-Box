import React, { useState, useEffect, useRef } from 'react';
import { autoPixelateImage, PixelateOptions } from '../utils/pixelate.js';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { sound } from '../utils/sound.js';

interface PixelImageModalProps {
  isOpen: boolean;
  rawImageSrc: string | null;
  onClose: () => void;
  onConfirm: (pixelatedDataUrl: string) => void;
}

export const PixelImageModal: React.FC<PixelImageModalProps> = ({
  isOpen,
  rawImageSrc,
  onClose,
  onConfirm,
}) => {
  const [resolution, setResolution] = useState<number>(64);
  const [palette, setPalette] = useState<'retro16' | 'gameboy' | 'nes' | 'cyberpunk' | 'vibrant'>('retro16');
  const [dither, setDither] = useState<boolean>(true);
  const [contrast, setContrast] = useState<number>(10);
  const [brightness, setBrightness] = useState<number>(0);
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Re-process when parameters change
  useEffect(() => {
    if (!isOpen || !rawImageSrc) return;

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = rawImageSrc;
    img.onload = () => {
      imgRef.current = img;
      const result = autoPixelateImage(img, {
        resolution,
        palette,
        dither,
        contrast,
        brightness,
      });
      setProcessedUrl(result);
      setIsProcessing(false);
    };
  }, [isOpen, rawImageSrc, resolution, palette, dither, contrast, brightness]);

  if (!isOpen || !rawImageSrc) return null;

  const handleApply = () => {
    if (!processedUrl) return;
    sound.playNotification();
    onConfirm(processedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-retro-card border-4 border-retro-shadow shadow-pixel-lg max-w-xl w-full p-4 sm:p-5 flex flex-col gap-4 animate-pixel-bounce max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-retro-border pb-2.5">
          <div className="flex items-center gap-2">
            <PixelIcon name="image" size={20} color="var(--color-primary)" />
            <h2 className="font-pixel text-xs sm:text-sm text-retro-text tracking-wide">
              Auto-Pixelate & Dither Engine
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-retro-muted hover:text-retro-text p-1 border-2 border-transparent hover:border-retro-border"
          >
            <PixelIcon name="close" size={16} />
          </button>
        </div>

        {/* Live Pixelated Canvas Preview */}
        <div className="flex flex-col items-center justify-center p-3 bg-retro-bg border-3 border-retro-shadow relative min-h-[220px]">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <PixelIcon name="sparkles" size={28} color="var(--color-primary)" className="animate-spin" />
              <span className="font-pixel text-[9px] text-retro-muted uppercase">
                Dithering Pixels...
              </span>
            </div>
          ) : processedUrl ? (
            <div className="relative border-2 border-retro-border overflow-hidden max-h-72 max-w-full flex items-center justify-center bg-black/50">
              <img
                src={processedUrl}
                alt="Pixelated preview"
                className="max-h-72 object-contain pixel-art"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 font-mono text-[9px] text-retro-primary border border-retro-shadow">
                {resolution}x{resolution} • {palette.toUpperCase()} • {dither ? 'DITHERED' : 'SOLID'}
              </div>
            </div>
          ) : null}
        </div>

        {/* Retro Controls */}
        <div className="flex flex-col gap-3 bg-retro-subtle p-3 border-2 border-retro-border">
          {/* Resolution Picker */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between font-pixel text-[8px] text-retro-muted uppercase">
              <span>Pixel Grid Resolution</span>
              <span className="font-mono text-retro-text">{resolution}px blocks</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { res: 48, label: '48px (Chunky 8-Bit)' },
                { res: 64, label: '64px (Classic 16-Bit)' },
                { res: 96, label: '96px (Arcade HD)' },
              ].map((r) => (
                <button
                  key={r.res}
                  onClick={() => {
                    sound.playClick();
                    setResolution(r.res);
                  }}
                  className={`font-pixel text-[8px] py-1.5 px-1 border-2 transition-none truncate ${
                    resolution === r.res
                      ? 'bg-retro-primary text-black border-retro-shadow font-bold'
                      : 'bg-retro-card text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette Quantization */}
          <div className="flex flex-col gap-1">
            <div className="font-pixel text-[8px] text-retro-muted uppercase">
              Retro Color Quantization
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'retro16', label: '16-Color' },
                { id: 'gameboy', label: 'Game Boy' },
                { id: 'nes', label: 'NES 8-Bit' },
                { id: 'cyberpunk', label: 'Cyber Neon' },
                { id: 'vibrant', label: 'Vibrant' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    sound.playClick();
                    setPalette(p.id as any);
                  }}
                  className={`font-pixel text-[8px] py-1.5 px-1 border-2 transition-none truncate ${
                    palette === p.id
                      ? 'bg-retro-accent text-black border-retro-shadow font-bold'
                      : 'bg-retro-card text-retro-text border-retro-border hover:border-retro-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dithering & Contrast Sliders */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-retro-border">
            {/* Dither toggle */}
            <div className="flex flex-col gap-1">
              <span className="font-pixel text-[8px] text-retro-muted uppercase">
                Floyd-Steinberg Dither
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setDither(!dither);
                }}
                className={`py-1 px-2 border-2 font-pixel text-[8px] uppercase ${
                  dither
                    ? 'bg-retro-success text-black border-retro-shadow font-bold'
                    : 'bg-retro-card text-retro-muted border-retro-border'
                }`}
              >
                DITHERING: {dither ? 'ENABLED' : 'OFF'}
              </button>
            </div>

            {/* Contrast adjustment */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between font-pixel text-[8px] text-retro-muted uppercase">
                <span>Contrast</span>
                <span className="font-mono text-retro-text">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                className="accent-retro-primary cursor-pointer h-2"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-retro-border">
          <button
            onClick={onClose}
            className="font-pixel text-[9px] text-retro-muted hover:text-retro-text uppercase"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <PixelButton variant="primary" size="md" onClick={handleApply}>
              ATTACH PIXEL ART
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
};
