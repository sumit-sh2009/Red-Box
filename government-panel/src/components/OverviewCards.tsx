import React from 'react';
import { Clock, CheckSquare, Flame, Activity, XOctagon } from 'lucide-react';
import type { CitizenRequest } from '../types';
import { retroAudio } from '../utils/retroAudio';

interface OverviewCardsProps {
  requests: CitizenRequest[];
  onFilterByStatus?: (status: string) => void;
  activeStatusFilter?: string;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  requests,
  onFilterByStatus,
  activeStatusFilter = 'all',
}) => {
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
  const highPriorityPendingCount = requests.filter(
    (r) => r.status === 'pending' && r.priority === 'high'
  ).length;

  const totalValid = pendingCount + inProgressCount + completedCount;
  const resolutionRate = totalValid > 0 ? Math.round((completedCount / totalValid) * 100) : 0;

  const padScore = (num: number) => String(num).padStart(4, '0');

  const handleCardClick = (status: string) => {
    retroAudio.playClick();
    if (onFilterByStatus) {
      onFilterByStatus(activeStatusFilter === status ? 'all' : status);
    }
  };

  return (
    <section className="mb-8">
      {/* Title & HUD Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-pixel text-sm sm:text-base text-[#ffe600] tracking-tight flex items-center gap-2 drop-shadow-[2px_2px_0_#000]">
            <span className="text-[#00ff88]">▶</span> MUNICIPAL ARCADE HUD // OVERVIEW
          </h2>
          <p className="font-retro text-lg text-slate-300">
            Live grievance telemetry and quest resolution scoreboard
          </p>
        </div>

        {/* Live sync pixel beacon */}
        <div className="flex items-center gap-2 font-pixel text-[9px] text-[#00ff88] bg-[#000000] px-3 py-1.5 border-2 border-[#00ff88] shadow-[3px_3px_0_#000000] self-start sm:self-auto">
          <span className="w-2 h-2 bg-[#00ff88] animate-ping inline-block" />
          <span>SYNC: ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* CARD 1: PENDING REQUESTS (Specified in Prompt) */}
        <div
          onClick={() => handleCardClick('pending')}
          className={`cursor-pointer pixel-panel p-5 transition-transform hover:-translate-y-1 ${
            activeStatusFilter === 'pending'
              ? 'pixel-panel-amber ring-4 ring-[#ffe600] bg-[#1a123f]'
              : 'border-[#000000] hover:border-[#ffe600]'
          }`}
        >
          <div className="flex items-center justify-between mb-3 border-b-2 border-[#000000] pb-2">
            <span className="font-pixel text-[9px] text-[#ffe600] uppercase tracking-wider bg-[#000000] px-2 py-1 border border-[#ffe600]">
              QUEUE HUD
            </span>
            <Clock className="w-5 h-5 text-[#ffe600]" />
          </div>

          <div className="mt-2">
            <div className="arcade-counter text-2xl sm:text-3xl text-[#ffe600] w-full text-center">
              {padScore(pendingCount)}
            </div>
            <div className="font-pixel text-[11px] text-white mt-2 tracking-wide">
              PENDING QUESTS
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#000000] flex items-center justify-between font-retro text-base text-slate-300">
            <span className="flex items-center gap-1 text-[#ff3355] font-bold">
              <Flame className="w-4 h-4" /> {highPriorityPendingCount} URGENT
            </span>
            <span className="font-pixel text-[8px] text-[#00f0ff]">
              {activeStatusFilter === 'pending' ? '[SELECTED]' : 'FILTER →'}
            </span>
          </div>
        </div>

        {/* CARD 2: IN PROGRESS (Active Missions) */}
        <div
          onClick={() => handleCardClick('in_progress')}
          className={`cursor-pointer pixel-panel p-5 transition-transform hover:-translate-y-1 ${
            activeStatusFilter === 'in_progress'
              ? 'pixel-panel-cyan ring-4 ring-[#00f0ff] bg-[#1a123f]'
              : 'border-[#000000] hover:border-[#00f0ff]'
          }`}
        >
          <div className="flex items-center justify-between mb-3 border-b-2 border-[#000000] pb-2">
            <span className="font-pixel text-[9px] text-[#00f0ff] uppercase tracking-wider bg-[#000000] px-2 py-1 border border-[#00f0ff]">
              ACTIVE RAIDS
            </span>
            <Activity className="w-5 h-5 text-[#00f0ff]" />
          </div>

          <div className="mt-2">
            <div className="arcade-counter text-2xl sm:text-3xl text-[#00f0ff] w-full text-center">
              {padScore(inProgressCount)}
            </div>
            <div className="font-pixel text-[11px] text-white mt-2 tracking-wide">
              IN-PROGRESS CREWS
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#000000] flex items-center justify-between font-retro text-base text-slate-300">
            <span className="text-[#00f0ff]">Field Squads Deployed</span>
            <span className="font-pixel text-[8px] text-[#00f0ff]">
              {activeStatusFilter === 'in_progress' ? '[SELECTED]' : 'FILTER →'}
            </span>
          </div>
        </div>

        {/* CARD 3: COMPLETED REQUESTS (Specified in Prompt) */}
        <div
          onClick={() => handleCardClick('completed')}
          className={`cursor-pointer pixel-panel p-5 transition-transform hover:-translate-y-1 ${
            activeStatusFilter === 'completed'
              ? 'pixel-panel-green ring-4 ring-[#00ff88] bg-[#1a123f]'
              : 'border-[#000000] hover:border-[#00ff88]'
          }`}
        >
          <div className="flex items-center justify-between mb-3 border-b-2 border-[#000000] pb-2">
            <span className="font-pixel text-[9px] text-[#00ff88] uppercase tracking-wider bg-[#000000] px-2 py-1 border border-[#00ff88]">
              STAGE CLEAR
            </span>
            <CheckSquare className="w-5 h-5 text-[#00ff88]" />
          </div>

          <div className="mt-2">
            <div className="arcade-counter text-2xl sm:text-3xl text-[#00ff88] w-full text-center">
              {padScore(completedCount)}
            </div>
            <div className="font-pixel text-[11px] text-white mt-2 tracking-wide">
              COMPLETED TASKS
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#000000] flex items-center justify-between font-retro text-base text-slate-300">
            <span className="text-[#00ff88] font-bold">{resolutionRate}% CLEAR RATE</span>
            <span className="font-pixel text-[8px] text-[#00ff88]">
              {activeStatusFilter === 'completed' ? '[SELECTED]' : 'FILTER →'}
            </span>
          </div>
        </div>

        {/* CARD 4: REJECTED / ARCHIVED */}
        <div
          onClick={() => handleCardClick('rejected')}
          className={`cursor-pointer pixel-panel p-5 transition-transform hover:-translate-y-1 ${
            activeStatusFilter === 'rejected'
              ? 'pixel-panel-magenta ring-4 ring-[#ff007f] bg-[#1a123f]'
              : 'border-[#000000] hover:border-[#ff007f]'
          }`}
        >
          <div className="flex items-center justify-between mb-3 border-b-2 border-[#000000] pb-2">
            <span className="font-pixel text-[9px] text-[#ff007f] uppercase tracking-wider bg-[#000000] px-2 py-1 border border-[#ff007f]">
              GAME OVER
            </span>
            <XOctagon className="w-5 h-5 text-[#ff007f]" />
          </div>

          <div className="mt-2">
            <div className="arcade-counter text-2xl sm:text-3xl text-[#ff007f] w-full text-center">
              {padScore(rejectedCount)}
            </div>
            <div className="font-pixel text-[11px] text-white mt-2 tracking-wide">
              REJECTED / ARCHIVED
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#000000] flex items-center justify-between font-retro text-base text-slate-300">
            <span className="text-[#ff3355]">Non-Jurisdiction</span>
            <span className="font-pixel text-[8px] text-[#ff007f]">
              {activeStatusFilter === 'rejected' ? '[SELECTED]' : 'FILTER →'}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
