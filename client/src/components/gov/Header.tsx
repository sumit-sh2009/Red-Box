import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { CustomButton } from './CustomButton.js';
import { retroAudio } from '../../utils/retroAudio.js';

interface HeaderProps {
  onOpenNewModal: () => void;
  onResetData: () => void;
  highPriorityPendingCount: number;
  lastUpdated?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewModal,
  onResetData,
  highPriorityPendingCount,
  lastUpdated,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(retroAudio.isMuted);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-retro-card border border-retro-border shadow-sm rounded-[4px] sticky top-0 z-30"
    >
      {highPriorityPendingCount > 0 && (
        <div className="bg-gradient-to-r from-[#fde8e8] to-[#fdf0e4] text-retro-danger px-4 py-2 border-b border-[#f0b4b0] border-l-[3px] border-l-retro-danger flex items-center gap-2 text-sm font-body">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <span className="font-semibold">{highPriorityPendingCount}</span> high-priority report{highPriorityPendingCount === 1 ? '' : 's'} awaiting inspection
          </span>
        </div>
      )}

      <div className="px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="min-w-0">
          <p className="civic-label mb-1 text-[color:var(--color-intel)]">Municipal intelligence</p>
          <h1 className="section-heading-lg text-retro-navy tracking-tight">
            Red-Box
          </h1>
          <p className="font-body text-sm text-retro-muted mt-0.5">
            Clusters and departments — not identities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-body text-[11px] text-retro-muted card-elevated bg-[color:var(--color-intel-subtle)] px-2.5 py-1.5 rounded-[6px]">
            <span className="intel-pulse" aria-hidden />
            Live civic store
            {lastUpdated ? ` · ${lastUpdated}` : ''}
          </span>
          <span className="hidden lg:inline font-mono text-xs text-retro-muted card-elevated bg-[color:var(--color-intel-subtle)] px-2.5 py-1.5 rounded-[6px]">
            {currentTime || '—'}
          </span>
          <button
            onClick={() => setIsMuted(retroAudio.toggleMute())}
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute interface sounds' : 'Mute interface sounds'}
            className="p-2 border border-retro-border text-retro-muted hover:text-retro-text rounded-[3px] cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              retroAudio.playClick();
              onResetData();
            }}
            title="Refresh live data"
            className="p-2 border border-retro-border text-retro-muted hover:text-retro-text rounded-[3px] cursor-pointer flex items-center gap-1.5 font-body text-xs font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
          <CustomButton variant="gold" size="md" onClick={onOpenNewModal}>
            City feed
          </CustomButton>
        </div>
      </div>
    </motion.header>
  );
};
