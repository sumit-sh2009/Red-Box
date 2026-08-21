import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  RotateCcw,
  Terminal,
  Clock,
  SlidersHorizontal,
  CheckSquare,
  XOctagon
} from 'lucide-react';
import type { CitizenRequest, Priority } from '../types';
import { WARDS } from '../data/mockRequests';
import { RequestCard } from './RequestCard';
import { retroAudio } from '../utils/retroAudio';

interface RequestListProps {
  requests: CitizenRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onResolve: (id: string) => void;
  onViewDetails: (request: CitizenRequest) => void;
  onImageClick: (url: string, title: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedWard: string;
  onWardChange: (ward: string) => void;
}

export const RequestList: React.FC<RequestListProps> = ({
  requests,
  onAccept,
  onReject,
  onResolve,
  onViewDetails,
  onImageClick,
  statusFilter,
  onStatusFilterChange,
  selectedWard,
  onWardChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'oldest'>('priority');

  // Priority numerical weights for strict sorting (High > Medium > Low)
  const priorityWeight: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter and Sort Requests
  const filteredAndSortedRequests = useMemo(() => {
    return requests
      .filter((req) => {
        if (statusFilter !== 'all' && req.status !== statusFilter) return false;
        if (selectedWard !== 'all' && req.ward !== selectedWard) return false;
        if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchCode = req.trackingCode.toLowerCase().includes(q);
          const matchName = req.citizenName.toLowerCase().includes(q);
          const matchLoc = req.location.toLowerCase().includes(q);
          const matchCat = req.category.toLowerCase().includes(q);
          const matchDesc = req.description.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchLoc && !matchCat && !matchDesc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
          if (diff !== 0) return diff;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else if (sortBy === 'newest') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
      });
  }, [requests, statusFilter, selectedWard, priorityFilter, searchQuery, sortBy]);

  const allCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleTabClick = (status: string) => {
    retroAudio.playClick();
    onStatusFilterChange(status);
  };

  return (
    <section className="pixel-panel p-5 sm:p-7">
      
      {/* 8-Bit Window Header Bar */}
      <div className="pixel-window-header -mt-5 -mx-5 sm:-mt-7 sm:-mx-7 mb-5">
        <span className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#ffe600]" />
          MISSION BOARD // ACTIVE CIVIC QUESTS & DISPATCH QUEUE
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-[#00ff88] border border-black cursor-pointer" />
          <span className="inline-block w-3 h-3 bg-[#ffe600] border border-black cursor-pointer" />
          <span className="inline-block w-3 h-3 bg-[#ff0055] border border-black cursor-pointer" />
        </div>
      </div>

      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#000000]">
        <div>
          <h2 className="font-pixel text-xs sm:text-sm text-white tracking-tight flex items-center gap-2">
            <span className="text-[#ffe600]">►</span> CITIZEN GRIEVANCE BATTLE LOG
          </h2>
          <p className="font-retro text-lg text-[#ff9900] mt-0.5">
            Ranked by danger severity index: High Priority quests pinned to top
          </p>
        </div>

        {/* Priority Sort Indicator */}
        <div className="flex items-center gap-2 bg-[#000000] p-2 border-2 border-[#ffe600] shadow-[2px_2px_0_#000] font-pixel text-[8px] text-white self-start md:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#ffe600]" />
          <span>SORT:</span>
          <span className="text-white bg-[#ff3355] px-1.5 py-0.5 border border-black font-bold">
            ★ HIGH
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-black bg-[#ffe600] px-1.5 py-0.5 border border-black font-bold">
            ◆ MED
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-black bg-[#00f0ff] px-1.5 py-0.5 border border-black font-bold">
            ● LOW
          </span>
        </div>
      </div>

      {/* Status Filter Tabs (Retro Button Strip) */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b-2 border-[#000000]">
        
        <button
          onClick={() => handleTabClick('all')}
          className={`px-3 py-1.5 font-pixel text-[9px] border-2 border-black transition whitespace-nowrap shadow-[3px_3px_0_#000] ${
            statusFilter === 'all'
              ? 'bg-[#ffe600] text-black font-black translate-x-[1px] translate-y-[1px]'
              : 'bg-[#08041a] hover:bg-[#1a0933] text-slate-300'
          }`}
        >
          ALL [{allCount}]
        </button>

        <button
          onClick={() => handleTabClick('pending')}
          className={`px-3 py-1.5 font-pixel text-[9px] border-2 border-black transition whitespace-nowrap shadow-[3px_3px_0_#000] flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-[#ffe600] text-black font-black translate-x-[1px] translate-y-[1px]'
              : 'bg-[#08041a] hover:bg-[#1a0933] text-[#ffe600]'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>PENDING [{pendingCount}]</span>
        </button>

        <button
          onClick={() => handleTabClick('in_progress')}
          className={`px-3 py-1.5 font-pixel text-[9px] border-2 border-black transition whitespace-nowrap shadow-[3px_3px_0_#000] flex items-center gap-1.5 ${
            statusFilter === 'in_progress'
              ? 'bg-[#00f0ff] text-black font-black translate-x-[1px] translate-y-[1px]'
              : 'bg-[#08041a] hover:bg-[#1a0933] text-[#00f0ff]'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>IN PROGRESS [{inProgressCount}]</span>
        </button>

        <button
          onClick={() => handleTabClick('completed')}
          className={`px-3 py-1.5 font-pixel text-[9px] border-2 border-black transition whitespace-nowrap shadow-[3px_3px_0_#000] flex items-center gap-1.5 ${
            statusFilter === 'completed'
              ? 'bg-[#00ff88] text-black font-black translate-x-[1px] translate-y-[1px]'
              : 'bg-[#08041a] hover:bg-[#1a0933] text-[#00ff88]'
          }`}
        >
          <CheckSquare className="w-3 h-3" />
          <span>CLEARED [{completedCount}]</span>
        </button>

        <button
          onClick={() => handleTabClick('rejected')}
          className={`px-3 py-1.5 font-pixel text-[9px] border-2 border-black transition whitespace-nowrap shadow-[3px_3px_0_#000] flex items-center gap-1.5 ${
            statusFilter === 'rejected'
              ? 'bg-[#ff3355] text-white font-black translate-x-[1px] translate-y-[1px]'
              : 'bg-[#08041a] hover:bg-[#1a0933] text-[#ff3355]'
          }`}
        >
          <XOctagon className="w-3 h-3" />
          <span>REJECTED [{rejectedCount}]</span>
        </button>

      </div>

      {/* Filter and Search Bar Controls */}
      <div className="my-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#ffe600] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search citizen, location, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pixel-input w-full pl-9"
          />
        </div>

        {/* Ward Dropdown */}
        <div>
          <select
            value={selectedWard}
            onChange={(e) => {
              retroAudio.playClick();
              onWardChange(e.target.value);
            }}
            className="pixel-input w-full cursor-pointer"
          >
            <option value="all">🏢 ALL WARDS & OFFICES ({requests.length})</option>
            {WARDS.map((w) => {
              const count = requests.filter((r) => r.ward === w).length;
              return (
                <option key={w} value={w}>
                  {w} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => {
              retroAudio.playClick();
              setPriorityFilter(e.target.value as any);
            }}
            className="pixel-input w-full cursor-pointer"
          >
            <option value="all">⚡ ALL PRIORITY TIERS</option>
            <option value="high">★ HIGH PRIORITY (RANK S)</option>
            <option value="medium">◆ MEDIUM PRIORITY (RANK A)</option>
            <option value="low">● LOW PRIORITY (RANK B)</option>
          </select>
        </div>

        {/* Sort Order Selector */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => {
              retroAudio.playClick();
              setSortBy(e.target.value as any);
            }}
            className="pixel-input w-full cursor-pointer"
          >
            <option value="priority">🔥 SORT: PRIORITY (HIGH TO LOW)</option>
            <option value="newest">🕒 SORT: NEWEST DISPATCH</option>
            <option value="oldest">⏳ SORT: OLDEST DISPATCH</option>
          </select>
        </div>

      </div>

      {/* Active Filter Chips */}
      {(searchQuery || selectedWard !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 mb-5 p-2.5 bg-[#08041a] border-2 border-black shadow-[2px_2px_0_#000] font-retro text-lg">
          <span className="text-[#ffe600] font-bold flex items-center gap-1">
            <Filter className="w-4 h-4" /> ACTIVE FILTERS:
          </span>

          {statusFilter !== 'all' && (
            <span className="bg-[#000000] text-[#00f0ff] px-2 py-0.5 border border-[#00f0ff] flex items-center gap-1 font-pixel text-[8px]">
              STATUS: {statusFilter.toUpperCase()}
              <button onClick={() => onStatusFilterChange('all')} className="text-white hover:text-red-400 ml-1 font-bold">×</button>
            </span>
          )}

          {selectedWard !== 'all' && (
            <span className="bg-[#000000] text-[#ffe600] px-2 py-0.5 border border-[#ffe600] flex items-center gap-1 font-pixel text-[8px]">
              WARD: {selectedWard}
              <button onClick={() => onWardChange('all')} className="text-white hover:text-red-400 ml-1 font-bold">×</button>
            </span>
          )}

          {priorityFilter !== 'all' && (
            <span className="bg-[#000000] text-[#ff007f] px-2 py-0.5 border border-[#ff007f] flex items-center gap-1 font-pixel text-[8px]">
              RANK: {priorityFilter.toUpperCase()}
              <button onClick={() => setPriorityFilter('all')} className="text-white hover:text-red-400 ml-1 font-bold">×</button>
            </span>
          )}

          <button
            onClick={() => {
              retroAudio.playClick();
              setSearchQuery('');
              onStatusFilterChange('all');
              onWardChange('all');
              setPriorityFilter('all');
            }}
            className="ml-auto text-[#ff3355] font-pixel text-[8px] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> CLEAR FILTERS
          </button>
        </div>
      )}

      {/* Grid of Quest Cards */}
      {filteredAndSortedRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={onAccept}
              onReject={onReject}
              onResolve={onResolve}
              onViewDetails={onViewDetails}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-[#08041a] border-4 border-dashed border-[#ffe600]/40 p-8">
          <div className="w-16 h-16 bg-[#000000] border-2 border-[#ffe600] text-[#ffe600] flex items-center justify-center mx-auto mb-4 font-pixel text-xl">
            ?
          </div>
          <h3 className="font-pixel text-xs text-[#ffe600] mb-2">
            NO CIVIC QUESTS MATCHED YOUR FILTERS
          </h3>
          <p className="font-retro text-lg text-slate-400 max-w-sm mx-auto mb-5">
            Reset your search query or select "ALL WARDS" to view available citizen reports.
          </p>
          <button
            onClick={() => {
              retroAudio.playClick();
              setSearchQuery('');
              onStatusFilterChange('all');
              onWardChange('all');
              setPriorityFilter('all');
            }}
            className="px-4 py-2 bg-[#ffe600] text-black font-pixel text-[9px] border-2 border-black shadow-[3px_3px_0_#000] hover:bg-[#fffa65] transition"
          >
            RESET ALL FILTERS
          </button>
        </div>
      )}

    </section>
  );
};
