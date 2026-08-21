import React, { useMemo } from 'react';

const PARTICLE_COUNT = 18;

export const AmbientParticles: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const size = 2 + Math.floor(Math.random() * 4);
      const left = Math.random() * 100;
      const delay = Math.random() * 20;
      const duration = 15 + Math.random() * 25;
      const startY = 80 + Math.random() * 30;
      return { id: i, size, left, delay, duration, startY };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="pixel-particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.startY}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
