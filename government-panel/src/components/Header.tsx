import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, AlertTriangle, Terminal, Sparkles } from 'lucide-react';
import { CustomButton } from './CustomButton';
import { retroAudio } from '../utils/retroAudio';

interface HeaderProps {
  onOpenNewModal: () => void;
  onResetData: () => void;
  highPriorityPendingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewModal,
  onResetData,
  highPriorityPendingCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(retroAudio.isMuted);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const muted = retroAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="bg-[#08041a] text-white border-b-4 border-[#000000] shadow-[0_6px_0_#000000] sticky top-0 z-30">
      
      {/* Top 8-Bit Urgent Ticker Banner */}
      {highPriorityPendingCount > 0 && (
        <div className="bg-[#ff0055] text-white px-4 py-1.5 border-b-2 border-[#000000] font-pixel text-[10px] sm:text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="inline-block w-2.5 h-2.5 bg-[#ffe600] animate-ping" />
            <AlertTriangle className="w-4 h-4 text-[#ffe600] shrink-0" />
            <span className="tracking-wider">
              [CRITICAL ALERT] {highPriorityPendingCount} HIGH-PRIORITY CIVIC QUEST(S) REQUIRE IMMEDIATE FIELD DISPATCH!
            </span>
          </div>
        </div>
      )}

      {/* Main Arcade Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & 8-Bit Seal */}
          <div className="flex items-center gap-3.5">
            {/* Pixel Emblem Box */}
            <div className="w-12 h-12 bg-[#ffe600] border-4 border-[#000000] shadow-[4px_4px_0_#000000] flex items-center justify-center shrink-0">
              <span className="font-pixel text-[#000000] text-xl font-black">★</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-pixel text-base sm:text-xl text-[#00f0ff] tracking-tight flex items-center gap-2 drop-shadow-[2px_2px_0_#000000]">
                  CIVICPULSE <span className="text-[#ffe600] text-[10px] sm:text-xs bg-[#1f0a42] px-2 py-1 border-2 border-[#000000]">8-BIT GOV</span>
                </h1>
              </div>
              <p className="font-retro text-lg sm:text-xl text-[#ff9900] tracking-wide mt-0.5 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#00ff88]" />
                Municipal Grievance Redressal & Field Operations Terminal
              </p>
            </div>
          </div>

          {/* Right Action & Clock Area */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Retro Clock HUD */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#000000] border-2 border-[#ff007f] shadow-[3px_3px_0_#000000] text-xs font-pixel text-[#00ff88]">
              <span className="w-2 h-2 bg-[#00ff88] animate-pulse inline-block" />
              <span>{currentTime || '00:00:00'}</span>
            </div>

            {/* 8-Bit Audio SFX Toggle */}
            <button
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute 8-bit Audio' : 'Mute 8-bit Audio'}
              className="p-2.5 bg-[#120c2e] hover:bg-[#2b0945] text-[#ffe600] border-2 border-[#000000] shadow-[3px_3px_0_#000000] transition flex items-center gap-1.5 text-xs font-pixel"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#ff3355]" /> : <Volume2 className="w-4 h-4 text-[#00ff88]" />}
              <span className="hidden sm:inline text-[9px]">{isMuted ? 'SFX: OFF' : 'SFX: ON'}</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={() => {
                retroAudio.playClick();
                onResetData();
              }}
              title="Reset sample data"
              className="p-2.5 bg-[#120c2e] hover:bg-[#2b0945] text-slate-200 hover:text-white border-2 border-[#000000] shadow-[3px_3px_0_#000000] transition flex items-center gap-1.5 text-xs font-pixel"
            >
              <RotateCcw className="w-4 h-4 text-[#00f0ff]" />
              <span className="hidden sm:inline text-[9px]">RESET</span>
            </button>

            {/* Custom Pixel 3D Button */}
            <CustomButton
              variant="gold"
              size="md"
              icon={<Sparkles className="w-4 h-4 text-black" />}
              onClick={onOpenNewModal}
            >
              + LOG QUEST
            </CustomButton>

          </div>
        </div>
      </div>
    </header>
  );
};
