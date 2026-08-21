import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import type { CitizenRequest, Priority } from '../../types/index.js';
import { WARDS } from '../../data/mockRequests.js';
import { RequestCard } from './RequestCard.js';
import { retroAudio } from '../../utils/retroAudio.js';

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

  const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

  const filteredAndSortedRequests = useMemo(() => {
    return requests
      .filter((req) => {
        if (statusFilter !== 'all' && req.status !== statusFilter) return false;
        if (selectedWard !== 'all' && req.ward !== selectedWard) return false;
        if (priorityFilter !== 'all' && req.priority !== priorityFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const hay = [req.trackingCode, req.citizenName, req.location, req.category, req.description]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
          if (diff !== 0) return diff;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }, [requests, statusFilter, selectedWard, priorityFilter, searchQuery, sortBy]);

  return (
    <section className="card-elevated p-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-retro-border">
        <div>
          <p className="civic-label mb-1">Priority queue</p>
          <h2 className="section-heading">Reports table</h2>
          <p className="font-body text-sm text-retro-muted mt-0.5">Sorted by urgency, then recency</p>
        </div>
      </div>

      <div className="my-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-retro-subtle/30 rounded-lg p-3">
        <div className="relative">
          <label htmlFor="gov-search" className="sr-only">Search reports</label>
          <Search className="w-4 h-4 text-retro-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            id="gov-search"
            type="text"
            placeholder="Search tracking, location, category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pixel-input w-full pl-9 py-2 rounded-lg"
          />
        </div>
        <label className="sr-only" htmlFor="gov-ward">Ward</label>
        <select
          id="gov-ward"
          value={selectedWard}
          onChange={(e) => {
            retroAudio.playClick();
            onWardChange(e.target.value);
          }}
          className="pixel-input w-full cursor-pointer py-2 rounded-lg"
        >
          <option value="all">All wards ({requests.length})</option>
          {WARDS.map((w) => (
            <option key={w} value={w}>
              {w} ({requests.filter((r) => r.ward === w).length})
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => {
            retroAudio.playClick();
            setPriorityFilter(e.target.value as Priority | 'all');
          }}
          className="pixel-input w-full cursor-pointer py-2 rounded-lg"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => {
            retroAudio.playClick();
            setSortBy(e.target.value as 'priority' | 'newest' | 'oldest');
          }}
          className="pixel-input w-full cursor-pointer py-2 rounded-lg"
        >
          <option value="priority">Sort: priority</option>
          <option value="newest">Sort: newest</option>
          <option value="oldest">Sort: oldest</option>
        </select>
      </div>

      {(searchQuery || selectedWard !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center gap-2 mb-4 font-body text-xs">
          <Filter className="w-3.5 h-3.5 text-retro-muted" />
          {statusFilter !== 'all' && <span className="border border-retro-border px-2 py-0.5 rounded-[3px]">Status: {statusFilter}</span>}
          {selectedWard !== 'all' && <span className="border border-retro-border px-2 py-0.5 rounded-[3px]">{selectedWard}</span>}
          {priorityFilter !== 'all' && <span className="border border-retro-border px-2 py-0.5 rounded-[3px]">{priorityFilter}</span>}
          <button
            onClick={() => {
              setSearchQuery('');
              onStatusFilterChange('all');
              onWardChange('all');
              setPriorityFilter('all');
            }}
            className="ml-auto text-retro-danger font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        </motion.div>
      )}

      {filteredAndSortedRequests.length > 0 ? (
        <>
          <div className="hidden lg:block overflow-x-auto border border-retro-border rounded-lg shadow-elevated max-w-full">
            <table className="gov-table text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[28%]" />
                <col className="w-[16%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-retro-subtle/60">
                <tr className="civic-label">
                  <th className="px-4 py-3 font-normal">Tracking</th>
                  <th className="px-4 py-3 font-normal">Issue</th>
                  <th className="px-4 py-3 font-normal">Location</th>
                  <th className="px-4 py-3 font-normal">Priority</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Submitted</th>
                  <th className="px-4 py-3 font-normal">Photo</th>
                  <th className="px-4 py-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>

          <div className="lg:hidden flex flex-col gap-3">
            {filteredAndSortedRequests.map((request, index) => (
              <motion.article 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }}
                key={request.id} 
                className="card-elevated border border-retro-border rounded-lg p-3 bg-retro-card"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-retro-navy">{request.trackingCode}</span>
                  <span className="font-body text-[11px] font-semibold">Priority: {request.priority}</span>
                </div>
                <p className="font-body text-sm font-semibold line-clamp-3">{request.description}</p>
                <p className="font-body text-xs text-retro-muted mt-1">{request.category} · {request.location}</p>
                <p className="font-body text-xs mt-1">Status: {request.status.replace('_', ' ')}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onViewDetails(request)}
                    className="px-2 py-1 border border-retro-border font-body text-[11px] font-semibold rounded-[3px] cursor-pointer"
                  >
                    Details
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button type="button" onClick={() => onAccept(request.id)} className="px-2 py-1 bg-retro-navy text-white font-body text-[11px] font-semibold rounded-[3px] cursor-pointer">
                        Assign
                      </button>
                      <button type="button" onClick={() => onReject(request.id)} className="px-2 py-1 border border-retro-danger text-retro-danger font-body text-[11px] font-semibold rounded-[3px] cursor-pointer">
                        Close
                      </button>
                    </>
                  )}
                  {request.status === 'in_progress' && (
                    <button type="button" onClick={() => onResolve(request.id)} className="px-2 py-1 bg-retro-success text-white font-body text-[11px] font-semibold rounded-[3px] cursor-pointer">
                      Resolve
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center border border-dashed border-retro-border rounded-[3px]">
          <h3 className="font-body font-semibold text-retro-text mb-1">No reports match these filters</h3>
          <p className="font-body text-sm text-retro-muted mb-4">Clear filters to see the live queue.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              onStatusFilterChange('all');
              onWardChange('all');
              setPriorityFilter('all');
            }}
            className="px-3 py-1.5 bg-retro-navy text-white font-body text-xs font-semibold border border-retro-navy rounded-[3px] cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
};
