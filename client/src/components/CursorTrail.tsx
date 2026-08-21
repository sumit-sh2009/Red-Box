import React, { useEffect, useRef } from 'react';

const TRAIL_LENGTH = 14;
const TRAIL_DECAY = 0.88;
const BURST_COUNT = 10;

interface Particle {
  x: number;
  y: number;
  life: number;
  size: number;
  colorIdx: number;
  vx?: number;
  vy?: number;
  spin?: boolean;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.trim().replace(/^#/, '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r, g, b };
};

export const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const trail = useRef<Particle[]>([]);
  const raf = useRef<number>(0);
  const lastSpawn = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const readThemeColors = () => {
      const styles = getComputedStyle(document.documentElement);
      const primary = styles.getPropertyValue('--color-primary').trim() || '#ffd166';
      const accent = styles.getPropertyValue('--color-accent').trim() || '#06d6a0';
      return [hexToRgb(primary), hexToRgb(accent)];
    };

    // React to theme switches so the trail follows the active palette
    const colors = readThemeColors();
    const observer = new MutationObserver(() => {
      const fresh = readThemeColors();
      colors[0] = fresh[0];
      colors[1] = fresh[1];
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const now = Date.now();
      if (now - lastSpawn.current > 16) {
        lastSpawn.current = now;
        trail.current.push({
          x: e.clientX,
          y: e.clientY,
          life: 1,
          size: 3 + Math.random() * 3,
          colorIdx: Math.random() < 0.78 ? 0 : 1,
        });
        if (trail.current.length > TRAIL_LENGTH * 3) {
          trail.current = trail.current.slice(-TRAIL_LENGTH * 2);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < BURST_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / BURST_COUNT + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 3;
        trail.current.push({
          x: e.clientX,
          y: e.clientY,
          life: 1,
          size: 2 + Math.random() * 3,
          colorIdx: Math.random() < 0.5 ? 0 : 1,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('click', handleClick);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf.current);
      } else {
        raf.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      trail.current = trail.current.filter((p) => p.life > 0.05);

      for (const particle of trail.current) {
        particle.life *= TRAIL_DECAY;

        if (particle.vx !== undefined && particle.vy !== undefined) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.92;
          particle.vy *= 0.92;
        }

        const alpha = particle.life * 0.7;
        const s = particle.size * particle.life;
        const color = colors[particle.colorIdx];

        // Pixel-snapped rendering (no sub-pixel)
        const px = Math.round(particle.x - s / 2);
        const py = Math.round(particle.y - s / 2);
        const ps = Math.round(s);

        if (ps < 1) continue;

        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fillRect(px, py, ps, ps);

        // Tiny glow square behind
        if (particle.life > 0.4) {
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.25})`;
          ctx.fillRect(px - 1, py - 1, ps + 2, ps + 2);
        }
      }

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99998]"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};