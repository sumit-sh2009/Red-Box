import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import { PixelButton } from './PixelButton.js';
import { PixelIcon } from './PixelIcon.js';
import { sound } from '../utils/sound.js';

interface RightSidebarProps {
  onSearch: (q: string) => void;
  onNavigateTag: (_tag: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [issueMix, setIssueMix] = useState<Array<{ name: string; count: number }>>([]);

  const loadData = useCallback(() => {
    api.complaints.list({ limit: 50 }).then((res) => {
      const counts: Record<string, number> = {};
      res.complaints.forEach((c) => {
        const cat = (c.category || c.ai?.category || '').trim();
        if (!cat) return;
        counts[cat] = (counts[cat] || 0) + 1;
      });
      setIssueMix(
        Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sound.playClick();
    onSearch(searchQuery.trim());
  };

  return (
    <aside className="w-72 xl:w-80 shrink-0 flex flex-col gap-5 sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto pr-1 select-none">
      <form onSubmit={handleSearchSubmit} className="relative">
        <label htmlFor="civic-search" className="sr-only">Search reports</label>
        <input
          id="civic-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reports…"
          className="pixel-input w-full pl-10 pr-4 py-2.5 text-sm placeholder:text-retro-muted/60 font-pixel-body"
        />
        <div className="absolute left-2.5 top-2.5 text-retro-muted pointer-events-none">
          <PixelIcon name="search" size={14} />
        </div>
      </form>

      <div className="pixel-box p-3.5 flex flex-col gap-2.5">
        <div className="civic-label border-b border-retro-border pb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <PixelIcon name="building" size={14} color="var(--color-navy)" />
            Intelligence
          </span>
          <span className="civic-label">Anonymous</span>
        </div>

        <div className="text-sm font-body text-retro-muted leading-relaxed">
          File a civic issue. The public card never shows your username.
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="bg-retro-subtle p-2 border border-retro-border flex flex-col items-center text-center">
            <span className="civic-label text-retro-navy">Live</span>
            <span className="font-body text-xs text-retro-muted">City reports</span>
          </div>
          <div className="bg-retro-subtle p-2 border border-retro-border flex flex-col items-center text-center">
            <span className="civic-label text-retro-saffron">Clusters</span>
            <span className="font-body text-xs text-retro-muted">Same issue, many voices</span>
          </div>
        </div>

        <PixelButton
          variant="primary"
          size="sm"
          onClick={() => {
            sound.playTab();
            window.location.hash = 'gov-panel';
          }}
          className="w-full justify-center mt-1"
        >
          <PixelIcon name="building" size={13} color="#fff" />
          Open intelligence
        </PixelButton>
      </div>

      <div className="pixel-box p-3.5 flex flex-col gap-2.5">
        <div className="civic-label border-b border-retro-border pb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <PixelIcon name="flame" size={14} color="var(--color-saffron)" />
            Active civic issues
          </span>
          <span className="civic-label text-retro-navy">From filings</span>
        </div>

        {issueMix.length === 0 ? (
          <p className="font-body text-sm text-retro-muted">No classified reports in the current feed yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-retro-border/70">
            {issueMix.slice(0, 6).map((item, idx) => (
              <button
                type="button"
                key={item.name}
                onClick={() => {
                  sound.playClick();
                  onSearch(item.name);
                }}
                className="py-2 hover:bg-retro-subtle px-1 cursor-pointer text-left flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-body font-semibold text-sm text-retro-text truncate">{item.name}</div>
                  <div className="text-xs text-retro-muted font-body">{item.count} in recent filings</div>
                </div>
                <span className="font-mono text-[10px] px-2 py-1 border border-retro-border shrink-0 text-retro-muted">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-2 text-sm text-retro-muted font-terminal leading-relaxed select-text">
        CivicPulse · civic reports · 2026
      </div>
    </aside>
  );
};
